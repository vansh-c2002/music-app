export async function saveAbFeedback(
  preferredModel: "legato" | "homr",
  sessionId: string,
  fileName: string,
  idToken: string
): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return;

  const formData = new FormData();
  formData.append("preferred_model", preferredModel);
  formData.append("session_id", sessionId);
  formData.append("file_name", fileName);

  await fetch(`${apiUrl}/ab-feedback`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  });
}
