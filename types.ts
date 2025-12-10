// ... istniejący kod ...

// Dodatek dla File System Access API
export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  values: () => AsyncIterableIterator<FileSystemHandle>;
  getFileHandle: (name: string) => Promise<FileSystemFileHandle>;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  getFile: () => Promise<File>;
}