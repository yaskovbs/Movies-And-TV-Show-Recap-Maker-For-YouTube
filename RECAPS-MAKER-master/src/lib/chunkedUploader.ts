import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

interface UploadProgress {
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
  speed: number; // bytes per second
}

interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  onSuccess?: (fileUrl: string) => void;
  chunkSize?: number; // in bytes
  storageService?: 'supabase' | 'firebase' | 'local';
}

class ChunkedUploader {
  private static instance: ChunkedUploader;
  private abortControllers: Map<string, AbortController> = new Map();
  private uploadStartTimes: Map<string, number> = new Map();
  private lastUploadedBytes: Map<string, number> = new Map();
  private uploadSpeeds: Map<string, number[]> = new Map();

  private constructor() {}

  public static getInstance(): ChunkedUploader {
    if (!ChunkedUploader.instance) {
      ChunkedUploader.instance = new ChunkedUploader();
    }
    return ChunkedUploader.instance;
  }

  public async uploadFile(
    file: File,
    path: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const {
      onProgress,
      onError,
      onSuccess,
      chunkSize = 5 * 1024 * 1024, // 5MB default
      storageService = 'supabase'
    } = options;

    // Get storage settings from localStorage
    const storageSettingsStr = localStorage.getItem('storage_settings');
    let storageSettings = null;
    if (storageSettingsStr) {
      try {
        storageSettings = JSON.parse(storageSettingsStr);
        if (storageSettings.chunkSize) {
          // Convert from MB to bytes
          options.chunkSize = storageSettings.chunkSize * 1024 * 1024;
        }
      } catch (error) {
        console.error('Error parsing storage settings:', error);
      }
    }

    // Use the specified storage service or the one from settings
    const actualStorageService = storageSettings?.preferredStorage || storageService;

    // Generate a unique ID for this upload
    const uploadId = uuidv4();
    this.abortControllers.set(uploadId, new AbortController());
    this.uploadStartTimes.set(uploadId, Date.now());
    this.lastUploadedBytes.set(uploadId, 0);
    this.uploadSpeeds.set(uploadId, []);

    try {
      // Choose the appropriate upload method based on storage service
      let fileUrl: string;
      
      switch (actualStorageService) {
        case 'supabase':
          fileUrl = await this.uploadToSupabase(file, path, uploadId, options);
          break;
        case 'firebase':
          fileUrl = await this.uploadToFirebase(file, path, uploadId, options);
          break;
        case 'local':
          fileUrl = await this.uploadToLocalStorage(file, path, uploadId, options);
          break;
        default:
          fileUrl = await this.uploadToSupabase(file, path, uploadId, options);
      }

      onSuccess?.(fileUrl);
      return fileUrl;
    } catch (error) {
      onError?.(error as Error);
      throw error;
    } finally {
      // Clean up
      this.abortControllers.delete(uploadId);
      this.uploadStartTimes.delete(uploadId);
      this.lastUploadedBytes.delete(uploadId);
      this.uploadSpeeds.delete(uploadId);
    }
  }

  public cancelUpload(uploadId: string): void {
    const controller = this.abortControllers.get(uploadId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(uploadId);
    }
  }

  private async uploadToSupabase(
    file: File,
    path: string,
    uploadId: string,
    options: UploadOptions
  ): Promise<string> {
    const { onProgress, chunkSize = 5 * 1024 * 1024 } = options;
    const totalSize = file.size;
    const totalChunks = Math.ceil(totalSize / chunkSize);
    let uploadedBytes = 0;

    // For files smaller than the chunk size, upload directly
    if (totalSize <= chunkSize) {
      const { data, error } = await supabase.storage
        .from('recaps')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recaps')
        .getPublicUrl(path);
        
      return urlData.publicUrl;
    }

    // For larger files, upload in chunks
    const chunks: Blob[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(totalSize, start + chunkSize);
      chunks.push(file.slice(start, end));
    }

    // Create temporary folder for chunks
    const tempFolderPath = `temp/${uploadId}`;
    
    // Upload each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkPath = `${tempFolderPath}/chunk_${i}`;
      
      const { error } = await supabase.storage
        .from('recaps')
        .upload(chunkPath, chunk, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) throw error;
      
      uploadedBytes += chunk.size;
      
      // Calculate upload speed
      this.updateUploadSpeed(uploadId, uploadedBytes);
      
      // Report progress
      if (onProgress) {
        onProgress({
          totalBytes: totalSize,
          uploadedBytes,
          percentage: Math.round((uploadedBytes / totalSize) * 100),
          currentChunk: i + 1,
          totalChunks,
          speed: this.getAverageSpeed(uploadId)
        });
      }
    }
    
    // Now we need to tell the server to combine the chunks
    // This would typically be done with a server-side function
    // For this example, we'll assume the server has a function to combine chunks
    
    // For now, we'll just return the path to the first chunk as a placeholder
    const { data: urlData } = supabase.storage
      .from('recaps')
      .getPublicUrl(`${tempFolderPath}/chunk_0`);
      
    return urlData.publicUrl;
  }

  private async uploadToFirebase(
    file: File,
    path: string,
    uploadId: string,
    options: UploadOptions
  ): Promise<string> {
    // Firebase implementation would go here
    // This is a placeholder for now
    return Promise.resolve(`https://example.com/firebase/${path}`);
  }

  private async uploadToLocalStorage(
    file: File,
    path: string,
    uploadId: string,
    options: UploadOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const { onProgress } = options;
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          if (typeof data === 'string') {
            localStorage.setItem(`file_${path}`, data);
            
            if (onProgress) {
              onProgress({
                totalBytes: file.size,
                uploadedBytes: file.size,
                percentage: 100,
                currentChunk: 1,
                totalChunks: 1,
                speed: 0
              });
            }
            
            resolve(`local://${path}`);
          } else {
            reject(new Error('Failed to read file as data URL'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  private updateUploadSpeed(uploadId: string, uploadedBytes: number): void {
    const now = Date.now();
    const startTime = this.uploadStartTimes.get(uploadId) || now;
    const lastUploadedBytes = this.lastUploadedBytes.get(uploadId) || 0;
    const speeds = this.uploadSpeeds.get(uploadId) || [];
    
    const timeDiff = now - startTime;
    if (timeDiff > 0) {
      const byteDiff = uploadedBytes - lastUploadedBytes;
      const speed = byteDiff / (timeDiff / 1000);
      
      // Keep only the last 5 speed measurements for a moving average
      if (speeds.length >= 5) {
        speeds.shift();
      }
      speeds.push(speed);
      
      this.uploadSpeeds.set(uploadId, speeds);
      this.lastUploadedBytes.set(uploadId, uploadedBytes);
    }
  }

  private getAverageSpeed(uploadId: string): number {
    const speeds = this.uploadSpeeds.get(uploadId) || [];
    if (speeds.length === 0) return 0;
    
    const sum = speeds.reduce((acc, speed) => acc + speed, 0);
    return sum / speeds.length;
  }
}

export default ChunkedUploader.getInstance();