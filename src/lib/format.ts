export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeRotation(value: number) {
  return ((value % 360) + 360) % 360;
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

export function formatModifiedDate(modifiedMs?: number) {
  if (!modifiedMs) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(modifiedMs));
}

export function formatExifDate(value?: string | null) {
  if (!value) return null;

  const match = value.match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) return value;

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export function formatOrientation(value?: number | null) {
  if (!value) return null;

  switch (value) {
    case 1:
      return "Normal";
    case 2:
      return "Mirrored horizontally";
    case 3:
      return "Rotated 180°";
    case 4:
      return "Mirrored vertically";
    case 5:
      return "Mirrored, then 90° CW";
    case 6:
      return "Rotated 90° CW";
    case 7:
      return "Mirrored, then 90° CCW";
    case 8:
      return "Rotated 90° CCW";
    default:
      return String(value);
  }
}
