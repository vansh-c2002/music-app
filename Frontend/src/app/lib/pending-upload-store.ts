interface PendingUpload {
  files: File[];
  scoreType: string;
  sessionId: string;
}

let pending: PendingUpload | null = null;

export function setPendingUpload(value: PendingUpload | null) {
  pending = value;
}

export function getPendingUpload(): PendingUpload | null {
  return pending;
}
