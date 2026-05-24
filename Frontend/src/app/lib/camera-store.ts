let capturedFile: File | null = null;

export function setCapturedFile(file: File | null) {
  capturedFile = file;
}

export function getCapturedFile(): File | null {
  return capturedFile;
}
