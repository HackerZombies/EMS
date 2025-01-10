import React from 'react';
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

const documentTypes: { key: keyof UploadedDocuments; label: string }[] = [
  { key: 'resume', label: 'Resume' },
  { key: 'education', label: 'Education' },
  { key: 'identity', label: 'Identity' },
  { key: 'certification', label: 'Certification' },
  { key: 'skills', label: 'Skills' },
  { key: 'others', label: 'Others' },
];

export default function DocumentsForm({ uploadedDocuments, setUploadedDocuments }: DocumentsFormProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type: keyof UploadedDocuments = 'others';
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

  const handleCategoryChange = (
    currentType: keyof UploadedDocuments,
    fileIndex: number,
    newType: keyof UploadedDocuments
  ) => {
    setUploadedDocuments((prev) => {
      const fileToMove = prev[currentType][fileIndex];
      if (!fileToMove) return prev;

      const updatedCurrent = prev[currentType].filter((_, i) => i !== fileIndex);
      const updatedNew = [...prev[newType], fileToMove];

      return {
        ...prev,
        [currentType]: updatedCurrent,
        [newType]: updatedNew,
      };
    });
  };

  const addDocumentInput = () => {
    const input = document.getElementById(`file-upload`) as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  };

  const allDocuments: Array<{
    file: File;
    displayName: string;
    category: keyof UploadedDocuments;
  }> = [];

  documentTypes.forEach(({ key }) => {
    uploadedDocuments[key].forEach((doc) => {
      allDocuments.push({ ...doc, category: key });
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-lg font-semibold">Uploaded Documents</Label>
        <Button type="button" size="sm" onClick={addDocumentInput}>
          Add Document
        </Button>
      </div>
      <Input
        id="file-upload"
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {allDocuments.length > 0 && (
        <ul className="space-y-2">
          {allDocuments.map(({ file, displayName, category }, i) => (
            <li key={`${category}-${i}`} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center space-x-2">
                <span className="w-48 truncate" title={displayName}>{displayName}</span>
                <span className="text-gray-500 text-sm">.{file.name.split('.').pop()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(category, uploadedDocuments[category].findIndex(d => d.file === file), e.target.value as keyof UploadedDocuments)}
                  className="border rounded-md px-2 py-1"
                >
                  {documentTypes.map(({ key: optionKey, label: optionLabel }) => (
                    <option key={optionKey} value={optionKey}>
                      {optionLabel}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    const currentCat = category;
                    const currentIdx = uploadedDocuments[currentCat].findIndex(d => d.file === file);
                    if (currentIdx !== -1) {
                      removeFile(currentCat, currentIdx);
                    }
                  }}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
