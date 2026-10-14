const FILENAME_REGEX = /^.*[\\/]/;

export function getFilename(path: string) {
  return path.replace(FILENAME_REGEX, "");
}
