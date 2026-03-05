import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, File, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import type { VideoFile } from '../types'
import chunkedUploader from '../lib/chunkedUploader'

interface EnhancedVideoUploaderProps {
  onFileSelect: (file: VideoFile) => void
  selectedFile: VideoFile | null
  onRemoveFile: () => void
}

interface UploadStatus {
  isUploading: boolean;
  progress: number;
  speed: number;
  error: string | null;
  success: boolean;
  fileUrl: string | null;
}

const EnhancedVideoUploader = ({ 
  onFileSelect, 
  selectedFile, 
  onRemoveFile 
}: EnhancedVideoUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    progress: 0,
    speed: 0,
    error: null,
    success: false,
    fileUrl: null
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Load storage settings
  const [maxSize, setMaxSize] = useState(3 * 1024 * 1024 * 1024); // 3GB default
  
  useEffect(() => {
    const storageSettingsStr = localStorage.getItem('storage_settings');
    if (storageSettingsStr) {
      try {
        const settings = JSON.parse(storageSettingsStr);
        if (settings.maxFileSize) {
          // Convert from MB to bytes
          setMaxSize(settings.maxFileSize * 1024 * 1024);
        }
      } catch (error) {
        console.error('Error parsing storage settings:', error);
      }
    }
  }, []);

  const supportedFormats = ['MP4', 'AVI', 'MOV', 'MKV', 'WEBM'];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    // File type check
    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      setUploadStatus({
        ...uploadStatus,
        error: `סוג קובץ לא נתמך. קבצים נתמכים: ${supportedFormats.join(', ')}`
      });
      return;
    }

    // File size check
    if (file.size > maxSize) {
      setUploadStatus({
        ...uploadStatus,
        error: `הקובץ גדול מדי. גודל מקסימלי: ${formatFileSize(maxSize)}`
      });
      return;
    }

    const videoFile: VideoFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    };

    onFileSelect(videoFile);

    // Start upload process
    setUploadStatus({
      isUploading: true,
      progress: 0,
      speed: 0,
      error: null,
      success: false,
      fileUrl: null
    });

    try {
      // Get storage settings
      const storageSettingsStr = localStorage.getItem('storage_settings');
      let storageService: 'supabase' | 'firebase' | 'local' = 'supabase';
      
      if (storageSettingsStr) {
        try {
          const settings = JSON.parse(storageSettingsStr);
          if (settings.preferredStorage) {
            storageService = settings.preferredStorage;
          }
        } catch (error) {
          console.error('Error parsing storage settings:', error);
        }
      }

      // Upload the file
      const filePath = `uploads/${videoFile.id}/${file.name}`;
      const fileUrl = await chunkedUploader.uploadFile(file, filePath, {
        onProgress: (progress) => {
          setUploadStatus({
            ...uploadStatus,
            progress: progress.percentage,
            speed: progress.speed,
            isUploading: true
          });
        },
        storageService
      });

      // Update status on success
      setUploadStatus({
        isUploading: false,
        progress: 100,
        speed: 0,
        error: null,
        success: true,
        fileUrl
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        ...uploadStatus,
        isUploading: false,
        error: `שגיאה בהעלאת הקובץ: ${(error as Error).message}`,
        success: false
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 KB/s';
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(1)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  if (selectedFile) {
    return (
      <motion.div 
        className="bg-gray-800 rounded-lg p-6 border-2 border-green-500"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <File className="h-8 w-8 text-green-400" />
            <div className="text-right">
              <h3 className="text-lg font-medium text-white">{selectedFile.name}</h3>
              <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button 
            onClick={onRemoveFile}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="הסר קובץ"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Upload Status */}
        {uploadStatus.isUploading && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-400">מעלה קובץ...</span>
              <span className="text-sm text-gray-400">{uploadStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadStatus.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">מהירות: {formatSpeed(uploadStatus.speed)}</span>
              <span className="text-xs text-gray-500">
                {uploadStatus.progress < 100 ? 'מעלה...' : 'הועלה בהצלחה'}
              </span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadStatus.success && (
          <div className="mt-4 p-2 bg-green-900/30 border border-green-500 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-400 text-sm">הקובץ הועלה בהצלחה</span>
          </div>
        )}

        {/* Error Message */}
        {uploadStatus.error && (
          <div className="mt-4 p-2 bg-red-900/30 border border-red-500 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-400 text-sm">{uploadStatus.error}</span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".mp4,.avi,.mov,.mkv,.webm"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            handleFileSelection(files[0]);
          }
        }}
      />
      
      <Upload className="h-12 w-12 mx-auto text-gray-500" />
      <h3 className="mt-2 text-lg font-medium text-white">גרור וידאו לכאן</h3>
      <p className="mt-1 text-sm text-gray-400">או לחץ לבחירת קובץ</p>
      
      <button
        type="button"
        onClick={openFileDialog}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        בחר קובץ
      </button>
      
      <p className="mt-4 text-xs text-gray-500">
        פורמטים נתמכים: {supportedFormats.join(', ')} | גודל מקסימלי: {formatFileSize(maxSize)}
      </p>
    </motion.div>
  );
};

export default EnhancedVideoUploader;