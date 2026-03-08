"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Film, X, FileVideo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface VideoFile {
  file: File
  preview: string
  name: string
  size: number
}

interface VideoUploaderProps {
  selectedFile: VideoFile | null
  onFileSelect: (file: VideoFile | null) => void
  onRemoveFile: () => void
}

export default function VideoUploader({ selectedFile, onFileSelect, onRemoveFile }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("video/")) {
      processFile(file)
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [])

  const processFile = (file: File) => {
    const preview = URL.createObjectURL(file)
    onFileSelect({
      file,
      preview,
      name: file.name,
      size: file.size
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (selectedFile) {
    return (
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileVideo className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-white font-medium truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onRemoveFile}
            className="text-gray-400 hover:text-red-400"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <video 
          src={selectedFile.preview} 
          controls 
          className="w-full rounded-lg max-h-64 object-contain bg-black"
        />
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
        isDragging 
          ? "border-blue-500 bg-blue-500/10" 
          : "border-gray-600 hover:border-gray-500 hover:bg-gray-700/50"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "p-4 rounded-full transition-colors",
          isDragging ? "bg-blue-500/20" : "bg-gray-700"
        )}>
          {isDragging ? (
            <Upload className="h-10 w-10 text-blue-400" />
          ) : (
            <Film className="h-10 w-10 text-gray-400" />
          )}
        </div>
        
        <div>
          <p className="text-white font-medium mb-1">
            {isDragging ? "שחרר את הקובץ כאן" : "גרור ושחרר קובץ וידאו כאן"}
          </p>
          <p className="text-gray-400 text-sm">
            או לחץ לבחירת קובץ
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
          <span className="bg-gray-700 px-2 py-1 rounded">MP4</span>
          <span className="bg-gray-700 px-2 py-1 rounded">AVI</span>
          <span className="bg-gray-700 px-2 py-1 rounded">MOV</span>
          <span className="bg-gray-700 px-2 py-1 rounded">MKV</span>
          <span className="bg-gray-700 px-2 py-1 rounded">עד 3GB</span>
        </div>
      </div>
    </div>
  )
}
