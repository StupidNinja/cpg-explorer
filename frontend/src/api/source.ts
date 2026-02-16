const API_BASE_URL = '/api';

export interface SourceCode {
  file: string;
  content: string;
  line?: number;
  end_line?: number;
}

export async function getNodeSource(nodeId: string, signal?: AbortSignal): Promise<SourceCode> {
  const response = await fetch(
    `${API_BASE_URL}/source/node/${encodeURIComponent(nodeId)}/context?lines=20`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch source code');
  }
  return response.json();
}

export async function getFileSource(filePath: string): Promise<SourceCode> {
  const response = await fetch(
    `${API_BASE_URL}/source/file?path=${encodeURIComponent(filePath)}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch file source');
  }
  return response.json();
}
