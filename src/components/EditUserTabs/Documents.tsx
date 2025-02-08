"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpSquare, ArrowDownSquare } from "lucide-react";
import { FiUpload } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "@/components/ui/modal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** 
 * Categories are already enumerated, 
 * each of these is a valid string literal. 
 */
const DocumentCategories = [
  // Identity
  "aadhaar_card",
  "pan_card",
  "passport",
  "voter_id",
  "driving_license",
  "other_identity_documents",

  // Education
  "tenth_marksheet",
  "twelfth_marksheet",
  "graduation_degree",
  "masters_degree",
  "postgraduate_degree",
  "diploma_certificate",
  "educational_transcript",
  "other_educational_documents",

  // Employment
  "resume",
  "previous_employment_certificate",
  "experience_letter",
  "relieving_letter",
  "salary_slip",
  "offer_letter",
  "appointment_letter",
  "employment_contract",
  "other_employment_documents",

  // Certification
  "professional_certifications",
  "language_certifications",
  "technical_certifications",
  "industry_specific_certifications",
  "other_certifications",

  // Address Proof
  "utility_bill",
  "rental_agreement",
  "bank_statement",
  "passport_copy",
  "ration_card",
  "lease_agreement",
  "other_address_proof",

  // Skills
  "portfolio",
  "project_documents",
  "skill_certificates",
  "training_completion_certificates",
  "other_skills_documents",

  // Financial
  "form_16",
  "it_return",
  "bank_passbook",
  "canceled_cheque",
  "salary_certificate",
  "other_financial_documents",

  // Insurance
  "health_insurance_policy",
  "life_insurance_policy",
  "motor_insurance",
  "other_insurance_documents",

  // Legal
  "nda_agreement",
  "legal_contracts",
  "court_clearance_certificate",
  "police_clearance_certificate",
  "other_legal_documents",

  // Professional Licenses
  "engineering_license",
  "medical_license",
  "teaching_license",
  "other_professional_licenses",

  // Company-Specific
  "signed_policies",
  "employee_handbook",
  "non_disclosure_agreement",
  "non_compete_agreement",
  "other_company_documents",

  // Dependents
  "spouse_aadhaar_card",
  "spouse_pan_card",
  "child_birth_certificate",
  "child_school_certificate",
  "other_dependents_documents",

  // Additional
  "photo",
  "medical_certificate",
  "reference_letters",
  "birth_certificate",
  "marriage_certificate",
  "resignation_letter",
  "other_documents",
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
  isEditMode: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ userUsername, isEditMode }) => {
  const [documents, setDocuments] = useState<{ [category: string]: Document[] }>({});
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategory>("other_documents");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Fetch documents once
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/users/employee-documents/${userUsername}`);
        if (!response.ok) throw new Error("Failed to fetch documents");

        const data: Document[] = await response.json();
        const groupedDocs = data.reduce((acc: Record<string, Document[]>, doc) => {
          acc[doc.category] = acc[doc.category] || [];
          acc[doc.category].push(doc);
          return acc;
        }, {});
        setDocuments(groupedDocs);
      } catch (error: any) {
        console.error("Error fetching documents:", error);
        toast.error(`Failed to fetch documents: ${error.message}`);
      }
    };

    if (userUsername) {
      fetchDocuments();
    }
  }, [userUsername]);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter((f) => f.size <= MAX_FILE_SIZE);
      if (validFiles.length < files.length) {
        toast.warn("Some files exceeded the 10MB limit and were omitted.");
      }
      setSelectedFiles(validFiles);
    }
  };

  // Handle Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.info("Please select files to upload.");
      return;
    }
    if (!isEditMode) {
      toast.info("You must be in Edit Mode to upload documents.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("category", selectedCategory);
      selectedFiles.forEach((file) => formData.append("files", file));

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/users/employee-documents/${userUsername}`, true);

      // track progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const uploadedDocs: Document[] = JSON.parse(xhr.responseText);
          setDocuments((prev) => {
            const nextDocs = { ...prev };
            uploadedDocs.forEach((doc) => {
              if (!nextDocs[doc.category]) {
                nextDocs[doc.category] = [];
              }
              nextDocs[doc.category].push(doc);
            });
            return nextDocs;
          });
          setSelectedFiles([]);
          toast.success("Documents uploaded successfully!");
        } else {
          let msg = "Failed to upload documents.";
          try {
            const err = JSON.parse(xhr.responseText);
            msg = err?.error || msg;
          } catch {}
          toast.error(msg);
        }
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.onerror = () => {
        setUploading(false);
        setUploadProgress(0);
        toast.error("An error occurred during the upload.");
      };

      xhr.send(formData);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload documents: ${error.message}`);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete single doc
  const handleDelete = async (id: string, category: DocumentCategory) => {
    if (!isEditMode) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/users/employee-documents/${userUsername}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id }),
      });
      if (!response.ok) {
        let errorMsg = "Failed to delete document.";
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      // Remove from state
      setDocuments((prev) => {
        const nextDocs = { ...prev };
        nextDocs[category] = nextDocs[category].filter((d) => d.id !== id);
        if (nextDocs[category].length === 0) {
          delete nextDocs[category];
        }
        return nextDocs;
      });
      toast.success("Document deleted!");
    } catch (err: any) {
      toast.error(`Delete error: ${err.message}`);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!isEditMode) return;
    if (selectedDocs.length === 0) {
      toast.info("No documents selected for deletion.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedDocs.length} documents?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedDocs.map(async (id) => {
          const response = await fetch(`/api/users/employee-documents/${userUsername}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId: id }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete document");
          }
          // Remove from state
          const categoryKey = Object.keys(documents).find((cat) =>
            documents[cat].some((doc) => doc.id === id)
          );
          if (categoryKey) {
            setDocuments((prev) => {
              const nextDocs = { ...prev };
              nextDocs[categoryKey] = nextDocs[categoryKey].filter((doc) => doc.id !== id);
              if (nextDocs[categoryKey].length === 0) delete nextDocs[categoryKey];
              return nextDocs;
            });
          }
        })
      );

      setSelectedDocs([]);
      toast.success("Selected documents deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting documents:", error);
      toast.error(`Failed to delete documents: ${error.message}`);
    }
  };

  // Toggle selection for bulk
  const toggleSelectDoc = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  // Drag-n-drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((f) => f.size <= MAX_FILE_SIZE);
    if (validFiles.length < files.length) {
      toast.warn("Some files exceeded the 10MB limit and were omitted.");
    }
    setSelectedFiles(validFiles);
  };

  // Optional image preview
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
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <h2 className="text-3xl font-bold mb-6">Manage Your Documents</h2>

      {/* Upload Section */}
      <div
        className={`mb-8 p-6 border-2 border-dashed rounded-lg ${
          isDragging ? "border-blue-400 bg-gray-100" : "border-gray-300 bg-gray-200"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && isEditMode) {
            fileInputRef.current?.click();
          }
        }}
      >
        <h3 className="text-xl font-semibold mb-4">Upload Documents</h3>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* File Input */}
          <label
            htmlFor="file-upload"
            className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer ${
              !isEditMode ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
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

          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
            className="p-2 rounded-lg bg-white border border-gray-300"
            disabled={!isEditMode}
          >
            {DocumentCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!isEditMode || uploading || selectedFiles.length === 0}
            className={`flex items-center bg-green-600 hover:bg-green-700 text-white ${
              (!isEditMode || uploading || selectedFiles.length === 0) &&
              "opacity-50 cursor-not-allowed"
            }`}
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2"
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
                  : "Uploading..."}
              </>
            ) : (
              <>
                <ArrowUpSquare className="w-5 h-5 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>

        {/* Selected Files Preview */}
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
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documents Listing */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Uploaded Documents</h3>
        {Object.keys(documents).length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {Object.entries(documents).map(([category, docs]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="text-lg font-medium text-gray-800">
                  {category
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
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
                                if (docs.every((d) => selectedDocs.includes(d.id))) {
                                  // uncheck all
                                  setSelectedDocs((prev) =>
                                    prev.filter((id) => !docs.some((d) => d.id === id))
                                  );
                                } else {
                                  // select all in that category
                                  setSelectedDocs((prev) => [
                                    ...prev,
                                    ...docs
                                      .filter((d) => !prev.includes(d.id))
                                      .map((d) => d.id),
                                  ]);
                                }
                              }}
                            />
                          </TableHead>
                        )}
                        <TableHead>Filename</TableHead>
                        <TableHead>Date Uploaded</TableHead>
                        <TableHead>Size (MB)</TableHead>
                        {isEditMode && <TableHead>Actions</TableHead>}
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
                              />
                            </TableCell>
                          )}
                          <TableCell className="flex items-center">
                            <ArrowDownSquare className="w-5 h-5 mr-2 text-gray-400" />
                            {doc.filename}
                          </TableCell>
                          <TableCell>
                            {new Date(doc.dateUploaded).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{(doc.size / 1048576).toFixed(2)}</TableCell>
                          {isEditMode && (
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600"
                                >
                                  <a href={doc.downloadUrl} download>
                                    <ArrowDownSquare className="w-4 h-4 mr-1" />
                                    Download
                                  </a>
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(doc.id, doc.category)}
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

      {/* Bulk Delete */}
      {isEditMode && selectedDocs.length > 0 && (
        <Button
          onClick={handleBulkDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 mt-4"
        >
          Delete Selected
        </Button>
      )}

      {/* Optional Image Modal */}
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
