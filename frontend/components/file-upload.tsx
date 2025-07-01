"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, File, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileUpload: (file: File, uploadId: string) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const uploadToServer = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      console.log("Upload response:", result)
      if (result.upload_id) {
        onFileUpload(file, result.upload_id)
      }
    } catch (err) {
      console.error("Upload failed:", err)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        setUploadedFile(file)
        // Remove direct call to onFileUpload here; it will be called from uploadToServer
        uploadToServer(file)
      }
    },
    [onFileUpload],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)
      // Remove direct call to onFileUpload here; it will be called from uploadToServer
      uploadToServer(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  return (
    <Card className="bg-black border border-white/20">
      <CardHeader className="border-b border-white/20">
        <CardTitle className="text-white">Upload Cell Data</CardTitle>
        <CardDescription className="text-gray-400">
          Upload your single-cell RNA sequencing data in CSV, H5, or H5AD format
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {!uploadedFile ? (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300",
              dragActive
                ? "border-white bg-white/5"
                : "border-white/20 hover:border-white/50 bg-black hover:bg-white/5",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-white mb-2">Drop your files here, or click to browse</p>
            <p className="text-sm text-gray-400 mb-4">Supports CSV, H5, H5AD files up to 500MB</p>
            <input type="file" accept=".csv,.h5,.h5ad" onChange={handleFileInput} className="hidden" id="file-upload" />
            <Button asChild className="bg-white text-black hover:bg-gray-200 border border-white">
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-black border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-white" />
                <div>
                  <p className="font-medium text-white">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-400">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-white hover:text-gray-300 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
