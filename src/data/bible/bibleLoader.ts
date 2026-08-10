// Helper to fetch and load Bible BDF datasets directly from the /bible directory path
export interface BibleDirectoryFile {
  id: string;
  name: string;
  file: string;
  encoding: 'utf-8' | 'euc-kr';
  description: string;
}

export async function fetchBibleDirectoryManifest(): Promise<BibleDirectoryFile[]> {
  try {
    const res = await fetch('/bible/bible_manifest.json');
    if (res.ok) {
      const data = await res.json();
      return data.files || [];
    }
  } catch (err) {
    console.error('Failed to load /bible/ manifest:', err);
  }
  return [
    {
      id: 'krv_sample',
      name: '개역한글',
      file: '/bible/krv_sample.bdf',
      encoding: 'utf-8',
      description: '/bible/krv_sample.bdf 베들레헴 성경 DB',
    },
    {
      id: 'kjv_sample',
      name: '킹제임스',
      file: '/bible/kjv_sample.bdf',
      encoding: 'utf-8',
      description: '/bible/kjv_sample.bdf 영문 성경 DB',
    },
  ];
}

export async function loadBibleFileFromPath(filePath: string, encoding: 'utf-8' | 'euc-kr' = 'utf-8'): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.arrayBuffer();
  } catch (err) {
    console.error(`Failed to fetch bible file at ${filePath}:`, err);
    return null;
  }
}
