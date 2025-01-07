'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@heroicons/react/24/outline';
import { FiUpload } from 'react-icons/fi';

const DocumentCategories = [
  'resume',
  'education',
  'identity',
  'certifications',
  'skills',
  'others',
] as const;

type DocumentCategory = typeof DocumentCategories[number];

interface Document {
  id: string;
  filename: string;
  fileType: string | null;
  size: number;
  dateUploaded: string;
  category: DocumentCategory;
  downloadUrl: string;
}

interface DocumentsSectionProps {
  userUsername: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ userUsername }) => {
  const [documents, setDocuments] = useState<{ [category: string]: Document[] }>({});
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('others');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/users/employee-documents/${userUsername}`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        const data = await response.json();

        const groupedDocs = data.reduce((acc: any, doc: Document) => {
          acc[doc.category] = acc[doc.category] || [];
          acc[doc.category].push(doc);
          return acc;
        }, {});

        setDocuments(groupedDocs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, [userUsername]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter((file) => file.size <= MAX_FILE_SIZE);
      if (validFiles.length < files.length) {
        alert(`Some files exceeded the size limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB and were not added.`);
      }
      setSelectedFiles(validFiles);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const files = selectedFiles.map(async (file) => {
        const fileData = await file.arrayBuffer();
        return {
          filename: file.name,
          fileType: file.type,
          fileData: Buffer.from(fileData).toString('base64'),
          size: file.size,
          category: selectedCategory,
        };
      });

      const response = await fetch(`/api/users/employee-documents/${userUsername}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: await Promise.all(files) }),
      });

      if (!response.ok) throw new Error('Failed to upload documents');

      const uploadedDocs = await response.json();
      setDocuments((prevDocs) => {
        const updatedDocs = { ...prevDocs };
        uploadedDocs.forEach((doc: Document) => {
          updatedDocs[doc.category] = updatedDocs[doc.category] || [];
          updatedDocs[doc.category].push(doc);
        });
        return updatedDocs;
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading documents:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, category: DocumentCategory) => {
    try {
      const response = await fetch(`/api/users/employee-documents/${userUsername}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: id }),
      });

      if (!response.ok) throw new Error('Failed to delete document');

      setDocuments((prevDocs) => {
        const updatedDocs = { ...prevDocs };
        updatedDocs[category] = updatedDocs[category].filter((doc) => doc.id !== id);
        if (updatedDocs[category].length === 0) delete updatedDocs[category];
        return updatedDocs;
      });
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-md text-white">
      <h2 className="text-2xl font-bold mb-6">Manage Your Documents</h2>

      {/* Upload Section */}
      <div className="mb-6 bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <label
            htmlFor="file-upload"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
          >
            <FiUpload className="w-5 h-5 mr-2" />
            <span>Choose Files</span>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
            className="p-2 rounded bg-gray-700"
          >
            {DocumentCategories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-4 text-sm">
            <p>Files to upload:</p>
            <ul className="list-disc pl-5">
              {selectedFiles.map((file) => (
                <li key={file.name}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Uploaded Documents Section */}
      <div className="bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
        {Object.entries(documents).map(([category, docs]) => (
          <div key={category} className="mb-6">
            <h4 className="text-md font-bold mb-2">{category.toUpperCase()}</h4>
            <ul className="divide-y divide-gray-700">
              {docs.map((doc) => (
                <li key={doc.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{doc.filename}</p>
                    <p className="text-sm text-gray-400">
                      {doc.size} bytes • Uploaded on {doc.dateUploaded}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <a
                      href={doc.downloadUrl}
                      download
                      className="text-blue-500 hover:text-blue-400"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id, doc.category)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsSection;
