export function isAppwriteConfigured(): boolean {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) return false;
  if (endpoint.trim() === '' || projectId.trim() === '') return false;
  if (projectId === 'YOUR_PROJECT_ID') return false;
  return true;
}

export function isPlaceholderProjectId(): boolean {
  return !isAppwriteConfigured();
}
