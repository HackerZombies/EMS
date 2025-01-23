// src/components/EditUserTabs/DocumentsSection.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowUpSquare, ArrowDownSquare, XCircle } from 'lucide-react'; // Updated imports
import { FiUpload } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal } from '@/components/ui/modal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Slot } from '@radix-ui/react-slot'; // Import Slot for asChild

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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Documents on Component Mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/users/employee-documents/${userUsername}`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        const data: Document[] = await response.json();

        const groupedDocs = data.reduce((acc: any, doc: Document) => {
          acc[doc.category] = acc[doc.category] || [];
          acc[doc.category].push(doc);
          return acc;
        }, {});

        setDocuments(groupedDocs);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to fetch documents.');
      }
    };

    fetchDocuments();
  }, [userUsername]);

  // Handle File Selection via Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter((file) => file.size <= MAX_FILE_SIZE);
      if (validFiles.length < files.length) {
        toast.warn(`Some files exceeded the 10MB size limit and were not added.`);
      }
      setSelectedFiles(validFiles);
    }
  };

  // Handle File Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.info('Please select files to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
        formData.append('category', selectedCategory);
      });

      const response = await fetch(`/api/users/employee-documents/${userUsername}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload documents');

      const uploadedDocs: Document[] = await response.json();
      setDocuments((prevDocs) => {
        const updatedDocs = { ...prevDocs };
        uploadedDocs.forEach((doc) => {
          updatedDocs[doc.category] = updatedDocs[doc.category] || [];
          updatedDocs[doc.category].push(doc);
        });
        return updatedDocs;
      });

      setSelectedFiles([]);
      toast.success('Documents uploaded successfully!');
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle Document Deletion
  const handleDelete = async (id: string, category: DocumentCategory) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

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

      toast.success('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document.');
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((file) => file.size <= MAX_FILE_SIZE);
      if (validFiles.length < files.length) {
        toast.warn(`Some files exceeded the 10MB size limit and were not added.`);
      }
      setSelectedFiles(validFiles);
    }
  };

  // Handle Image Preview in Modal (Optional)
  const openImageModal = (url: string) => {
    setSelectedImage(url);
    setModalOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setModalOpen(false);
  };

  return (
    <div className="bg-gray-50 p-8 rounded-lg shadow-md text-gray-800">
      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <h2 className="text-3xl font-bold mb-6">Manage Your Documents</h2>

      {/* Upload Section */}
      <div
        className={`mb-8 p-6 border-2 border-dashed rounded-lg transition-colors duration-300 ${
          isDragging ? 'border-blue-400 bg-gray-100' : 'border-gray-300 bg-gray-200'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h3 className="text-xl font-semibold mb-4">Upload Documents</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* File Upload Button */}
          <label
            htmlFor="file-upload"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition"
            aria-label="Upload Files"
          >
            <FiUpload className="w-5 h-5 mr-2" />
            <span>Choose Files</span>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </label>

          {/* Category Selection */}
          <select
            value={selectedCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSelectedCategory(e.target.value as DocumentCategory)
            }
            className="p-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:ring-blue-500"
            aria-label="Select Document Category"
          >
            {DocumentCategories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            aria-label="Upload Documents"
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <ArrowUpSquare className="w-5 h-5 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm mb-2">Files to upload:</p>
            <ul className="list-disc list-inside space-y-1">
              {selectedFiles.map((file) => (
                <li key={file.name}>
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Uploaded Documents Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Uploaded Documents</h3>
        {Object.keys(documents).length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {Object.entries(documents).map(([category, docs]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="text-lg font-medium text-gray-800">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Date Uploaded</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docs.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <span className="flex items-center">
                              <ArrowDownSquare className="w-5 h-5 mr-2 text-gray-400" />
                              {doc.filename}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(doc.dateUploaded).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {(doc.size / (1024 * 1024)).toFixed(2)} MB
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {/* Download Button */}
                              <Button
                                asChild // Use asChild to render as <a>
                                variant="outline"
                                size="sm"
                                className="flex items-center text-blue-600 hover:text-blue-500 transition"
                                aria-label={`Download ${doc.filename}`}
                              >
                                <a href={doc.downloadUrl} download>
                                  <ArrowDownSquare className="w-4 h-4 mr-1" />
                                  Download
                                </a>
                              </Button>

                              {/* Delete Button */}
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="flex items-center text-white hover:text-red-500 transition"
                                onClick={() => handleDelete(doc.id, doc.category)}
                                aria-label={`Delete ${doc.filename}`}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Image Preview Modal (Optional) */}
      {selectedImage && (
        <Modal isOpen={isModalOpen} onClose={closeImageModal}>
          <div className="flex justify-center items-center">
            <img src={selectedImage} alt="Document Preview" className="max-w-full max-h-full" />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DocumentsSection;
