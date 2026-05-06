use exif::{In, Reader, Tag, Value};
use serde::Serialize;
use std::{
    fs,
    io::BufReader,
    path::{Path, PathBuf},
    sync::Mutex,
    time::UNIX_EPOCH,
};
use tauri::{Emitter, Manager, RunEvent, State};

const SUPPORTED_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff", "avif", "svg",
];

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImageFile {
    path: String,
    name: String,
    extension: String,
    size: u64,
    modified_ms: Option<u128>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImageCollection {
    root_path: Option<String>,
    images: Vec<ImageFile>,
    selected_index: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImageMetadata {
    camera_model: Option<String>,
    color_space: Option<String>,
    date_time_original: Option<String>,
    exposure_time: Option<String>,
    f_number: Option<String>,
    focal_length: Option<String>,
    iso: Option<String>,
    lens_model: Option<String>,
    orientation: Option<u16>,
    software: Option<String>,
}

#[derive(Default)]
struct OpenedFilesState {
    paths: Mutex<Vec<String>>,
}

fn is_supported_image(path: &Path) -> bool {
    path.extension()
        .and_then(|value| value.to_str())
        .map(|extension| {
            SUPPORTED_EXTENSIONS
                .iter()
                .any(|supported| supported.eq_ignore_ascii_case(extension))
        })
        .unwrap_or(false)
}

fn image_file_from_path(path: PathBuf) -> Option<ImageFile> {
    let metadata = fs::metadata(&path).ok()?;

    if !metadata.is_file() || !is_supported_image(&path) {
        return None;
    }

    let name = path.file_name()?.to_string_lossy().to_string();
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    let modified_ms = metadata
        .modified()
        .ok()
        .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis());

    Some(ImageFile {
        path: path.to_string_lossy().to_string(),
        name,
        extension,
        size: metadata.len(),
        modified_ms,
    })
}

fn collect_directory_images(path: &Path) -> Result<Vec<ImageFile>, String> {
    let entries = fs::read_dir(path)
        .map_err(|error| format!("Could not read folder '{}': {error}", path.display()))?;

    let mut images = entries
        .filter_map(Result::ok)
        .filter_map(|entry| image_file_from_path(entry.path()))
        .collect::<Vec<_>>();

    images.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(images)
}

fn collection_from_path(path: PathBuf) -> Result<ImageCollection, String> {
    if path.is_dir() {
        let images = collect_directory_images(&path)?;

        if images.is_empty() {
            return Err(format!(
                "No supported images were found in '{}'.",
                path.display()
            ));
        }

        return Ok(ImageCollection {
            root_path: Some(path.to_string_lossy().to_string()),
            images,
            selected_index: 0,
        });
    }

    let selected_path = path
        .canonicalize()
        .map_err(|error| format!("Could not open '{}': {error}", path.display()))?;

    if !is_supported_image(&selected_path) {
        return Err(format!(
            "'{}' is not a supported image file.",
            selected_path.display()
        ));
    }

    let parent = selected_path.parent().map(Path::to_path_buf);
    let mut images = if let Some(parent_path) = &parent {
        collect_directory_images(parent_path)?
    } else {
        image_file_from_path(selected_path.clone()).into_iter().collect()
    };

    if images.is_empty() {
        return Err(format!("Could not load '{}'.", selected_path.display()));
    }

    let selected_index = images
        .iter()
        .position(|image| Path::new(&image.path) == selected_path.as_path())
        .unwrap_or(0);

    images.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    let selected_index = images
        .iter()
        .position(|image| Path::new(&image.path) == selected_path.as_path())
        .unwrap_or(selected_index);

    Ok(ImageCollection {
        root_path: parent.map(|value| value.to_string_lossy().to_string()),
        images,
        selected_index,
    })
}

fn field_display(exif: &exif::Exif, tag: Tag) -> Option<String> {
    exif.get_field(tag, In::PRIMARY)
        .map(|field| field.display_value().with_unit(exif).to_string())
}

fn orientation_value(exif: &exif::Exif) -> Option<u16> {
    let field = exif.get_field(Tag::Orientation, In::PRIMARY)?;
    match &field.value {
        Value::Short(values) => values.first().copied(),
        _ => None,
    }
}

fn image_metadata_from_path(path: PathBuf) -> Result<Option<ImageMetadata>, String> {
    let file = fs::File::open(&path)
        .map_err(|error| format!("Could not read metadata from '{}': {error}", path.display()))?;
    let mut reader = BufReader::new(file);
    let exif = match Reader::new().read_from_container(&mut reader) {
        Ok(exif) => exif,
        Err(exif::Error::NotFound(_) | exif::Error::InvalidFormat(_)) => return Ok(None),
        Err(error) => {
            return Err(format!(
                "Could not read EXIF metadata from '{}': {error}",
                path.display()
            ))
        }
    };

    Ok(Some(ImageMetadata {
        camera_model: field_display(&exif, Tag::Model),
        color_space: field_display(&exif, Tag::ColorSpace),
        date_time_original: field_display(&exif, Tag::DateTimeOriginal),
        exposure_time: field_display(&exif, Tag::ExposureTime),
        f_number: field_display(&exif, Tag::FNumber),
        focal_length: field_display(&exif, Tag::FocalLength),
        iso: field_display(&exif, Tag::PhotographicSensitivity)
            .or_else(|| field_display(&exif, Tag::ISOSpeed)),
        lens_model: field_display(&exif, Tag::LensModel),
        orientation: orientation_value(&exif),
        software: field_display(&exif, Tag::Software),
    }))
}

#[tauri::command]
fn load_path(path: String) -> Result<ImageCollection, String> {
    collection_from_path(PathBuf::from(path))
}

#[tauri::command]
fn load_image_metadata(path: String) -> Result<Option<ImageMetadata>, String> {
    image_metadata_from_path(PathBuf::from(path))
}

#[tauri::command]
fn take_opened_paths(state: State<'_, OpenedFilesState>) -> Vec<String> {
    let mut paths = state.paths.lock().expect("opened files mutex poisoned");
    std::mem::take(&mut *paths)
}

#[tauri::command]
fn load_paths(paths: Vec<String>) -> Result<ImageCollection, String> {
    if paths.is_empty() {
        return Err("No files were provided.".to_string());
    }

    if paths.len() == 1 {
        return collection_from_path(PathBuf::from(&paths[0]));
    }

    let mut images = paths
        .iter()
        .flat_map(|path| {
            let path = PathBuf::from(path);

            if path.is_dir() {
                collect_directory_images(&path).unwrap_or_default()
            } else {
                image_file_from_path(path).into_iter().collect()
            }
        })
        .collect::<Vec<_>>();

    images.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    if images.is_empty() {
        return Err("No supported images were found in the dropped items.".to_string());
    }

    Ok(ImageCollection {
        root_path: None,
        images,
        selected_index: 0,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(OpenedFilesState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            load_path,
            load_paths,
            load_image_metadata,
            take_opened_paths
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let RunEvent::Opened { urls } = event {
                let paths = urls
                    .into_iter()
                    .filter_map(|url| url.to_file_path().ok())
                    .map(|path| path.to_string_lossy().to_string())
                    .collect::<Vec<_>>();

                if paths.is_empty() {
                    return;
                }

                let state = app.state::<OpenedFilesState>();
                state
                    .paths
                    .lock()
                    .expect("opened files mutex poisoned")
                    .extend(paths.clone());

                let _ = app.emit("vision-space://opened-files", paths);
            }
        });
}
