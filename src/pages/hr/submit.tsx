"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  FileUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

// Shadcn UI components (adjust import paths as needed)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface Document {
  id: string;
  filename: string;
  dateSubmitted: string;
  status: string;
  rejectionReason?: string;
}

// Helper: sanitize the custom filename input to remove unwanted characters
const sanitizeFilename = (name: string): string => {
  // Allow only letters, numbers, spaces, hyphens, and underscores
  return name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
};

export default function SubmitDocument() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [customFilename, setCustomFilename] = useState<string>("");

  // Handle file selection and load the default filename (without extension)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      // Validate file type and size (max 10MB)
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Unsupported file type. Only PDF, DOC, and DOCX are allowed.");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum allowed size is 10MB.");
        return;
      }
      setFile(selectedFile);
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      setCustomFilename(nameWithoutExt);
      setError(null);
    }
  };

  // Rename the file using a sanitized version of the custom filename
  const renameFile = (originalFile: File, newName: string): File => {
    const fileExtension = originalFile.name.split(".").pop();
    const sanitizedNewName = sanitizeFilename(newName);
    const finalName = sanitizedNewName
      ? `${sanitizedNewName}.${fileExtension}`
      : originalFile.name;
    return new File([originalFile], finalName, { type: originalFile.type });
  };

  // Fetch documents for the logged-in user
  const fetchDocuments = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/hr/documents?submittedBy=${session.user.username}&page=${page}`
      );
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(data.documents || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to load documents.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [session, page]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle the document upload submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    const renamedFile = renameFile(file, customFilename);
    const formData = new FormData();
    formData.append("file", renamedFile);
    formData.append("submittedBy", session?.user?.username || "");
    setLoading(true);
    try {
      const res = await fetch("/api/hr/documents", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Upload failed. Please try again.");
        return;
      }
      setSuccess(`Document submitted successfully: ${result.filename}`);
      setFile(null);
      setCustomFilename("");
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Handle resubmission for rejected documents
  const handleResubmit = async (documentId: string) => {
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("Please select a file for resubmission.");
      return;
    }
    const renamedFile = renameFile(file, customFilename);
    const formData = new FormData();
    formData.append("file", renamedFile);
    formData.append("submittedBy", session?.user?.username || "");
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/documents/resubmit?id=${documentId}`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Resubmission failed.");
        return;
      }
      setSuccess(`Document resubmitted successfully: ${result.filename}`);
      setFile(null);
      setCustomFilename("");
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for status display
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-10 p-6 md:p-10 rounded-lg bg-black bg-opacity-20 min-h-screen">
      {/* Upload Card */}
      <Card className="bg-white shadow-2xl rounded-lg border border-gray-200 transition-transform transform hover:scale-105">
        <CardHeader className="text-center border-b border-gray-200 p-6">
          <CardTitle className="text-3xl font-semibold text-gray-900">
            Document Portal
          </CardTitle>
          <p className="text-gray-700 text-sm mt-2">
            Upload, manage, and track your document submissions.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-8 bg-white hover:bg-gray-100 transition-colors">
                {file ? (
                  <>
                    <FileUp className="w-10 h-10 text-gray-600" />
                    <p className="text-gray-800 mt-3 font-medium">{file.name}</p>
                  </>
                ) : (
                  <>
                    <FileUp className="w-10 h-10 text-gray-600" />
                    <p className="text-gray-600 mt-3 font-medium">
                      Click or drag &amp; drop to upload
                    </p>
                  </>
                )}
              </div>
            </div>
            {file && (
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                  <Label htmlFor="customFilename" className="sr-only">
                    Filename
                  </Label>
                  <Input
                    id="customFilename"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder="Enter desired filename"
                    className="w-full border border-gray-300 text-gray-900"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin w-5 h-5" />
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            )}
            {(error || success) && (
              <div
                className={`p-4 rounded-md text-sm ${
                  error
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {error ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  <span>{error || success}</span>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Documents List Card */}
      <Card className="bg-white shadow-2xl rounded-lg border border-gray-200 transition-transform transform hover:scale-105">
        <CardHeader className="border-b border-gray-200 p-6">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-700">Document</TableHead>
                <TableHead className="text-gray-700">Date</TableHead>
                <TableHead className="text-gray-700">Status</TableHead>
                <TableHead className="text-gray-700">Notes</TableHead>
                <TableHead className="text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="hover:bg-gray-100 transition-colors"
                  >
                    <TableCell className="flex items-center gap-3 text-gray-900">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span>{doc.filename}</span>
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {new Date(doc.dateSubmitted).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${getStatusColor(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        <span className="capitalize text-sm">
                          {doc.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {doc.rejectionReason || "—"}
                    </TableCell>
                    <TableCell>
                      {doc.status.toLowerCase() === "rejected" && (
                        <Button
                          size="sm"
                          onClick={() => handleResubmit(doc.id)}
                          variant="destructive"
                          className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition-colors"
                        >
                          Resubmit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-700 py-4"
                  >
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <Button
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md shadow hover:bg-gray-300 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
