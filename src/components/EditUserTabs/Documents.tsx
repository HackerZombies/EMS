// src/components/EditUserTabs/Documents.tsx

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowUpSquare, ArrowDownSquare } from 'lucide-react';
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
  isEditMode: boolean; // Added property
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ userUsername, isEditMode }) => { // Destructure isEditMode
  const [documents, setDocuments] = useState<{ [category: string]: Document[] }>({});
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('others');
  const [uploadProgress, setUploadProgress] = useState<number>(0); // Added progress state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]); // For bulk actions

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
      } catch (error: any) {
        console.error('Error fetching documents:', error);
        toast.error(`Failed to fetch documents: ${error.message}`);
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

  // Handle File Upload with Progress using fetch and Axios (if needed)
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.info('Please select files to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0); // Reset progress
    try {
      const formData = new FormData();
      formData.append('category', selectedCategory); // Append category once
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const xhr = new XMLHttpRequest();

      xhr.open('POST', `/api/users/employee-documents/${userUsername}`, true);

      // Update progress state
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentCompleted);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const uploadedDocs: Document[] = JSON.parse(xhr.responseText);
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
        } else {
          let errorMessage = 'Failed to upload documents';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
          }
          toast.error(`Failed to upload documents: ${errorMessage}`);
        }
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        setUploading(false);
        setUploadProgress(0);
        toast.error('An error occurred during the upload.');
      };

      xhr.send(formData);
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast.error(`Failed to upload documents: ${error.message}`);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle Document Deletion
  const handleDelete = async (id: string, category: DocumentCategory) => {
    if (!isEditMode) return; // Prevent deletion if not in edit mode
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/users/employee-documents/${userUsername}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: id }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete document';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      setDocuments((prevDocs) => {
        const updatedDocs = { ...prevDocs };
        updatedDocs[category] = updatedDocs[category].filter((doc) => doc.id !== id);
        if (updatedDocs[category].length === 0) delete updatedDocs[category];
        return updatedDocs;
      });

      toast.success('Document deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(`Failed to delete document: ${error.message}`);
    }
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedDocs.length === 0) {
      toast.info('No documents selected for deletion.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedDocs.length} documents?`)) return;

    try {
      await Promise.all(
        selectedDocs.map(async (id) => {
          const response = await fetch(`/api/users/employee-documents/${userUsername}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: id }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete document');
          }

          // Remove document from state
          const updatedCategory = Object.keys(documents).find((category) =>
            documents[category].some((doc) => doc.id === id)
          );
          if (updatedCategory) {
            setDocuments((prevDocs) => {
              const updatedDocs = { ...prevDocs };
              updatedDocs[updatedCategory] = updatedDocs[updatedCategory].filter((doc) => doc.id !== id);
              if (updatedDocs[updatedCategory].length === 0) delete updatedDocs[updatedCategory];
              return updatedDocs;
            });
          }
        })
      );

      setSelectedDocs([]);
      toast.success('Selected documents deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting documents:', error);
      toast.error(`Failed to delete some documents: ${error.message}`);
    }
  };

  // Toggle Selection for Bulk Actions
  const toggleSelectDoc = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        aria-label="Drag and drop files here or click to upload"
      >
        <h3 className="text-xl font-semibold mb-4">Upload Documents</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* File Upload Button */}
          <label
            htmlFor="file-upload"
            className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition ${
              !isEditMode ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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
              disabled={!isEditMode}
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
            disabled={!isEditMode}
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
            disabled={!isEditMode || uploading || selectedFiles.length === 0}
            className={`flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition ${
              (!isEditMode || uploading || selectedFiles.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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
                {uploadProgress > 0 && uploadProgress < 100
                  ? `Uploading... ${uploadProgress}%`
                  : 'Uploading...'}
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
            {/* Progress Bar */}
            {uploading && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
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
                        {isEditMode && (
                          <TableHead>
                            <input
                              type="checkbox"
                              checked={docs.every((doc) => selectedDocs.includes(doc.id))}
                              onChange={() => {
                                if (docs.every((doc) => selectedDocs.includes(doc.id))) {
                                  setSelectedDocs((prev) =>
                                    prev.filter((id) => !docs.some((doc) => doc.id === id))
                                  );
                                } else {
                                  setSelectedDocs((prev) => [
                                    ...prev,
                                    ...docs
                                      .filter((doc) => !prev.includes(doc.id))
                                      .map((doc) => doc.id),
                                  ]);
                                }
                              }}
                              aria-label={`Select all documents in ${category}`}
                            />
                          </TableHead>
                        )}
                        <TableHead>Filename</TableHead>
                        <TableHead>Date Uploaded</TableHead>
                        <TableHead>Size</TableHead>
                        {isEditMode && <TableHead>Actions</TableHead>} {/* Conditionally render Actions */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docs.map((doc) => (
                        <TableRow key={doc.id}>
                          {isEditMode && (
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedDocs.includes(doc.id)}
                                onChange={() => toggleSelectDoc(doc.id)}
                                aria-label={`Select ${doc.filename} for deletion`}
                              />
                            </TableCell>
                          )}
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
                          {isEditMode && (
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
                          )}
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

      {/* Bulk Delete Button */}
      {isEditMode && selectedDocs.length > 0 && (
        <Button
          onClick={handleBulkDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mt-4"
          aria-label="Delete selected documents"
        >
          Delete Selected
        </Button>
      )}

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
