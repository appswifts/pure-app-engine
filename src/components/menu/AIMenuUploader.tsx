import React, { useState, useCallback } from 'react';
import { Upload, FileImage, X, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  isSupportedFileType,
  getSupportedFileTypes,
} from '@/lib/services/ai-menu-import';

interface AIMenuUploaderProps {
  onFileSelected: (file: File) => void;
  onFileRemoved: () => void;
  isProcessing?: boolean;
  progress?: number;
}

export const AIMenuUploader: React.FC<AIMenuUploaderProps> = ({
  onFileSelected,
  onFileRemoved,
  isProcessing = false,
  progress = 0,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const supportedTypes = getSupportedFileTypes();
  const acceptedFormats = [...supportedTypes.images, ...(supportedTypes.pdfs || [])].join(', ');

  const handleFileValidation = (file: File): boolean => {
    setError(null);

    // Check file type
    if (!isSupportedFileType(file)) {
      setError(
        `Unsupported file type. Please upload: ${acceptedFormats}`
      );
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size exceeds 10MB. Please upload a smaller file.');
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!handleFileValidation(file)) {
        return;
      }

      setSelectedFile(file);
      onFileSelected(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        // Set PDF icon as preview
        setPreviewUrl(null);
      }
    },
    [onFileSelected]
  );

  const handleFileRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onFileRemoved();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!selectedFile && (
        <Card
          className={`border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-primary/50'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">
              Upload Menu Image or PDF
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your menu image or PDF here, or click to browse
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isProcessing}
            >
              <FileImage className="w-4 h-4 mr-2" />
              Choose File
            </Button>

            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={acceptedFormats}
              onChange={handleInputChange}
              disabled={isProcessing}
            />

            <div className="mt-4 text-xs text-gray-500">
              <p>Supported formats: {acceptedFormats}</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File Preview */}
      {selectedFile && (
        <Card>
          <div className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {selectedFile.type === 'application/pdf' ? (
                  <FileText className="w-8 h-8 text-primary" />
                ) : (
                  <FileImage className="w-8 h-8 text-primary" />
                )}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    ✓ 100% Free Processing
                  </p>
                </div>
              </div>

              {!isProcessing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileRemove}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Image Preview */}
            {previewUrl && (
              <div className="mt-4">
                <img
                  src={previewUrl}
                  alt="Menu preview"
                  className="max-h-64 mx-auto rounded-lg border"
                />
              </div>
            )}

            {/* Processing Progress */}
            {isProcessing && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Processing...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI is extracting menu data from your image
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips for best results:</strong>
          <ul className="list-disc list-inside mt-2 text-sm space-y-1">
            <li>Use clear, high-quality images</li>
            <li>Ensure text is readable and not blurry</li>
            <li>Include full menu sections in each image</li>
            <li>Good lighting and minimal glare work best</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
