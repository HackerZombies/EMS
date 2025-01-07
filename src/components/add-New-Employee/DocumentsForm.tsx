import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@heroicons/react/24/outline";

export interface UploadedDocuments {
  resume: { file: File; displayName: string }[];
  education: { file: File; displayName: string }[];
  identity: { file: File; displayName: string }[];
  certification: { file: File; displayName: string }[];
  skills: { file: File; displayName: string }[];
  others: { file: File; displayName: string }[];
}

interface DocumentsFormProps {
  setUploadedDocuments: React.Dispatch<React.SetStateAction<UploadedDocuments>>;
  uploadedDocuments: UploadedDocuments;
}

export default function DocumentsForm({ uploadedDocuments, setUploadedDocuments }: DocumentsFormProps) {
  const documentTypes: { key: keyof UploadedDocuments; label: string }[] = [
    { key: 'resume', label: 'Resume' },
    { key: 'education', label: 'Education Related Documents' },
    { key: 'identity', label: 'Identity Verification Related Documents' },
    { key: 'certification', label: 'Certification' },
    { key: 'skills', label: 'Skills or Certificates' },
    { key: 'others', label: 'Others' },
  ];

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: keyof UploadedDocuments
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        displayName: file.name.split('.').slice(0, -1).join('.'),
      }));
      setUploadedDocuments((prev) => ({
        ...prev,
        [type]: [...prev[type], ...newFiles],
      }));
      e.target.value = '';
    }
  };

  const removeFile = (type: keyof UploadedDocuments, index: number) => {
    setUploadedDocuments((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleEditName = (
    type: keyof UploadedDocuments,
    index: number,
    newName: string
  ) => {
    setUploadedDocuments((prev) => {
      const updatedCategory = [...prev[type]];
      updatedCategory[index] = { ...updatedCategory[index], displayName: newName };
      return { ...prev, [type]: updatedCategory };
    });
  };

  const addDocumentInput = (type: keyof UploadedDocuments) => {
    const input = document.getElementById(`file-upload-${type}`) as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  };

  return (
    <div className="space-y-6">
      {documentTypes.map(({ key, label }) => (
        <div key={key} className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor={`file-upload-${key}`} className="text-lg font-semibold">
              {label}
            </Label>
            <Button type="button" size="sm" onClick={() => addDocumentInput(key)}>
              {/* Type assertion */}
              Add Document
            </Button>
          </div>
          <Input
            id={`file-upload-${key}`}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, key as keyof UploadedDocuments)}
            // Type assertion
          />

          {uploadedDocuments[key]?.length > 0 && (
            <ul className="mt-2 space-y-2">
              {uploadedDocuments[key]?.map(({ file, displayName }, index: number) => (
                <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={displayName}
                      className="w-48 border rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:ring-primary"
                      onChange={(e) => handleEditName(key, index, e.target.value)}
                      // No assertion needed here, types align
                    />
                    <span className="text-gray-500 text-sm">.{file.name.split('.').pop()}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeFile(key, index)}
                      // No assertion needed here, types align
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}