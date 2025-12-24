// File System Access API service for working with local folders

export interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
}

export interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
}

export class FileSystemService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  async selectFolder(): Promise<FileSystemDirectoryHandle | null> {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      this.directoryHandle = handle;
      return handle;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return null; // User cancelled
      }
      throw error;
    }
  }

  async getFilesFromFolder(
    directoryHandle: FileSystemDirectoryHandle,
    extensions: string[] = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm']
  ): Promise<Array<{ handle: FileSystemFileHandle; name: string; path: string }>> {
    const files: Array<{ handle: FileSystemFileHandle; name: string; path: string }> = [];
    
    const scanDirectory = async (
      dir: FileSystemDirectoryHandle,
      path: string = ''
    ): Promise<void> => {
      for await (const entry of dir.values()) {
        if (entry.kind === 'file') {
          const ext = entry.name.split('.').pop()?.toLowerCase();
          if (ext && extensions.includes(ext)) {
            files.push({
              handle: entry as FileSystemFileHandle,
              name: entry.name,
              path: path ? `${path}/${entry.name}` : entry.name
            });
          }
        } else if (entry.kind === 'directory') {
          await scanDirectory(entry as FileSystemDirectoryHandle, path ? `${path}/${entry.name}` : entry.name);
        }
      }
    };

    await scanDirectory(directoryHandle);
    return files;
  }

  async checkIfFileProcessed(
    directoryHandle: FileSystemDirectoryHandle,
    filePath: string
  ): Promise<{ isProcessed: boolean; metadata: any | null }> {
    try {
      const pathParts = filePath.includes('/') ? filePath.split('/') : [filePath];
      const filename = pathParts[pathParts.length - 1];
      let targetDir = directoryHandle;
      
      // Navigate to subdirectory if needed
      if (pathParts.length > 1) {
        const dirPath = pathParts.slice(0, -1);
        for (const dirName of dirPath) {
          targetDir = await (targetDir as any).getDirectoryHandle(dirName);
        }
      }
      
      // Check for .pitagger.json file
      const metadataFilename = `${filename}.pitagger.json`;
      try {
        const metadataHandle = await (targetDir as any).getFileHandle(metadataFilename);
        const metadataFile = await metadataHandle.getFile();
        const metadataText = await metadataFile.text();
        const metadata = JSON.parse(metadataText);
        return { isProcessed: true, metadata };
      } catch (e) {
        // Metadata file doesn't exist
        return { isProcessed: false, metadata: null };
      }
    } catch (error) {
      return { isProcessed: false, metadata: null };
    }
  }

  async readFileForPreview(handle: FileSystemFileHandle): Promise<{ file: File; previewUrl: string }> {
    const file = await handle.getFile();
    const previewUrl = file.type.startsWith('image/') 
      ? URL.createObjectURL(file)
      : '';
    return { file, previewUrl };
  }

  async readFileForProcessing(handle: FileSystemFileHandle): Promise<File> {
    return await handle.getFile();
  }

  async saveMetadataFile(
    directoryHandle: FileSystemDirectoryHandle,
    filename: string,
    metadata: any
  ): Promise<void> {
    // Find the directory containing the file (handle nested paths)
    const pathParts = filename.includes('/') ? filename.split('/') : [filename];
    const actualFilename = pathParts[pathParts.length - 1];
    let targetDir = directoryHandle;
    
    // Navigate to subdirectory if needed
    if (pathParts.length > 1) {
      const dirPath = pathParts.slice(0, -1);
      for (const dirName of dirPath) {
        targetDir = await (targetDir as any).getDirectoryHandle(dirName);
      }
    }
    
    const metadataFilename = `${actualFilename}.pitagger.json`;
    const fileHandle = await (targetDir as any).getFileHandle(metadataFilename, { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(JSON.stringify(metadata, null, 2));
    await writable.close();
  }

  async renameFile(
    directoryHandle: FileSystemDirectoryHandle,
    oldName: string,
    newName: string
  ): Promise<void> {
    try {
      const oldHandle = await (directoryHandle as any).getFileHandle(oldName);
      const newHandle = await (directoryHandle as any).getFileHandle(newName, { create: true });
      
      // Copy file content
      const file = await oldHandle.getFile();
      const writable = await (newHandle as any).createWritable();
      await writable.write(await file.arrayBuffer());
      await writable.close();
      
      // Delete old file
      await (directoryHandle as any).removeEntry(oldName);
      
      // Also rename metadata file if it exists
      const oldMetadataName = `${oldName}.pitagger.json`;
      const newMetadataName = `${newName}.pitagger.json`;
      try {
        const oldMetadataHandle = await (directoryHandle as any).getFileHandle(oldMetadataName);
        const newMetadataHandle = await (directoryHandle as any).getFileHandle(newMetadataName, { create: true });
        const metadataFile = await oldMetadataHandle.getFile();
        const writable = await (newMetadataHandle as any).createWritable();
        await writable.write(await metadataFile.arrayBuffer());
        await writable.close();
        await (directoryHandle as any).removeEntry(oldMetadataName);
      } catch (e) {
        // Metadata file doesn't exist, that's okay
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  }

  getCurrentDirectory(): FileSystemDirectoryHandle | null {
    return this.directoryHandle;
  }

  setDirectory(handle: FileSystemDirectoryHandle | null) {
    this.directoryHandle = handle;
  }

  async saveCsvFile(
    directoryHandle: FileSystemDirectoryHandle,
    csvContent: string,
    filename: string = `pitagger_export_${new Date().toISOString().slice(0, 10)}.csv`
  ): Promise<void> {
    const fileHandle = await (directoryHandle as any).getFileHandle(filename, { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(csvContent);
    await writable.close();
  }

  async findExistingCsvFile(
    directoryHandle: FileSystemDirectoryHandle
  ): Promise<FileSystemFileHandle | null> {
    try {
      // Look for pitagger CSV files
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('pitagger_') && entry.name.endsWith('.csv')) {
          return entry as FileSystemFileHandle;
        }
      }
    } catch (e) {
      console.warn('Error finding CSV file:', e);
    }
    return null;
  }

  async readCsvFile(handle: FileSystemFileHandle): Promise<string> {
    const file = await handle.getFile();
    return await file.text();
  }

  async createCsvFile(
    directoryHandle: FileSystemDirectoryHandle,
    filename: string = 'pitagger_export.csv'
  ): Promise<void> {
    try {
      const fileHandle = await (directoryHandle as any).getFileHandle(filename, { create: true });
      const headers = 'Filename,Title,Keywords,Category,Releases,Description\n';
      const writable = await (fileHandle as any).createWritable();
      await writable.write(headers);
      await writable.close();
    } catch (error) {
      console.error('Error creating CSV file:', error);
      throw error;
    }
  }

  async appendToCsvFile(
    directoryHandle: FileSystemDirectoryHandle,
    csvRow: string,
    filename: string = 'pitagger_export.csv'
  ): Promise<void> {
    try {
      let fileHandle: FileSystemFileHandle;
      let existingContent = '';
      const newFilename = csvRow.split(',')[0].replace(/^"|"$/g, ''); // Extract filename from CSV row
      
      try {
        // Try to get existing file
        fileHandle = await (directoryHandle as any).getFileHandle(filename);
        existingContent = await this.readCsvFile(fileHandle);
        
        // Check if this filename already exists in CSV to avoid duplicates
        const lines = existingContent.split('\n');
        const existingFilenames = lines.slice(1).map(line => {
          const firstField = line.split(',')[0];
          return firstField.replace(/^"|"$/g, '');
        });
        
        if (existingFilenames.includes(newFilename)) {
          // File already in CSV, update the row instead of appending
          const updatedLines = lines.map((line, index) => {
            if (index === 0) return line; // Keep header
            const firstField = line.split(',')[0].replace(/^"|"$/g, '');
            return firstField === newFilename ? csvRow : line;
          });
          const writable = await (fileHandle as any).createWritable();
          await writable.write(updatedLines.join('\n') + '\n');
          await writable.close();
          return;
        }
        
        // Ensure it ends with newline
        if (!existingContent.endsWith('\n')) {
          existingContent += '\n';
        }
      } catch (e) {
        // File doesn't exist, create it with headers
        fileHandle = await (directoryHandle as any).getFileHandle(filename, { create: true });
        existingContent = 'Filename,Title,Keywords,Category,Releases,Description\n';
      }
      
      const writable = await (fileHandle as any).createWritable();
      await writable.write(existingContent + csvRow + '\n');
      await writable.close();
    } catch (error) {
      console.error('Error appending to CSV:', error);
      throw error;
    }
  }

  async updateCsvFile(
    directoryHandle: FileSystemDirectoryHandle,
    filename: string,
    allRows: string[]
  ): Promise<void> {
    try {
      const fileHandle = await (directoryHandle as any).getFileHandle(filename, { create: true });
      const headers = 'Filename,Title,Keywords,Category,Releases,Description\n';
      const content = headers + allRows.join('\n') + '\n';
      const writable = await (fileHandle as any).createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      console.error('Error updating CSV:', error);
      throw error;
    }
  }

  async renameFileInFolder(
    directoryHandle: FileSystemDirectoryHandle,
    filePath: string,
    newName: string
  ): Promise<void> {
    try {
      // Handle nested paths
      const pathParts = filePath.includes('/') ? filePath.split('/') : [filePath];
      const actualFilename = pathParts[pathParts.length - 1];
      let targetDir = directoryHandle;
      
      // Navigate to subdirectory if needed
      if (pathParts.length > 1) {
        const dirPath = pathParts.slice(0, -1);
        for (const dirName of dirPath) {
          targetDir = await (targetDir as any).getDirectoryHandle(dirName);
        }
      }
      
      const oldHandle = await (targetDir as any).getFileHandle(actualFilename);
      const newHandle = await (targetDir as any).getFileHandle(newName, { create: true });
      
      // Copy file content
      const file = await oldHandle.getFile();
      const writable = await (newHandle as any).createWritable();
      await writable.write(await file.arrayBuffer());
      await writable.close();
      
      // Delete old file
      await (targetDir as any).removeEntry(actualFilename);
      
      // Also rename metadata file if it exists
      const oldMetadataName = `${actualFilename}.pitagger.json`;
      const newMetadataName = `${newName}.pitagger.json`;
      try {
        const oldMetadataHandle = await (targetDir as any).getFileHandle(oldMetadataName);
        const newMetadataHandle = await (targetDir as any).getFileHandle(newMetadataName, { create: true });
        const metadataFile = await oldMetadataHandle.getFile();
        const writable = await (newMetadataHandle as any).createWritable();
        await writable.write(await metadataFile.arrayBuffer());
        await writable.close();
        await (targetDir as any).removeEntry(oldMetadataName);
      } catch (e) {
        // Metadata file doesn't exist, that's okay
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  }
}

export const fileSystemService = new FileSystemService();

