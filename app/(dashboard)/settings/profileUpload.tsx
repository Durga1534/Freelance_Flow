"use client";

import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { uploadProfileImage, deleteProfileImage } from '@/lib/profile';

export default function ProfileUpload({ userId, currentImageUrl, onImageUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload file
      const fileId = await uploadProfileImage(file, userId);
      
      // Notify parent component
      if (onImageUpdate) {
        onImageUpdate(fileId);
      }

      // Clean up preview URL
      URL.revokeObjectURL(preview);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload profile image');
      setPreviewUrl(currentImageUrl); // Revert preview
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      setUploading(true);
      await deleteProfileImage(currentImageUrl, userId);
      setPreviewUrl(null);
      
      if (onImageUpdate) {
        onImageUpdate(null);
      }
    } catch (error) {
      console.error('Remove failed:', error);
      alert('Failed to remove profile image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </button>

        {/* Remove Button */}
        {previewUrl && (
          <button
            onClick={handleRemoveImage}
            disabled={uploading}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 disabled:opacity-50"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-sm text-gray-600 text-center">
        Click the upload button to change your profile picture
      </p>
    </div>
  );
}