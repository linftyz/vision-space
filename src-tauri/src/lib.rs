use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
    time::UNIX_EPOCH,
};

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

#[tauri::command]
fn load_path(path: String) -> Result<ImageCollection, String> {
    collection_from_path(PathBuf::from(path))
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
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![load_path, load_paths])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
