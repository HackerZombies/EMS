"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Upload, RefreshCw, FileText, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, FileUp } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  dateSubmitted: string;
  status: string;
  rejectionReason?: string;
}

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
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  const fetchDocuments = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/hr/documents?submittedBy=${session.user.username}&page=${page}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setCustomFilename(selectedFile?.name.split(".").slice(0, -1).join(".") || "");
    setIsRenaming(true);
  };

  const handleRename = () => {
    if (!file) return;
    const fileExtension = file.name.split(".").pop();
    const newFileName = `${customFilename}.${fileExtension}`;
    const renamedFile = new File([file], newFileName, { type: file.type });
    setFile(renamedFile);
    setIsRenaming(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("submittedBy", session?.user?.username || "");

    setLoading(true);
    try {
      const response = await fetch("/api/hr/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(
          errorData.error || "An error occurred while uploading the document."
        );
        return;
      }

      const result = await response.json();
      setSuccess(`Document submitted successfully: ${result.filename}`);
      setFile(null);
      setCustomFilename("");
      setIsRenaming(false);
      await fetchDocuments();
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (documentId: string) => {
    if (!file) {
      setError("Please select a file to upload for resubmission.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("submittedBy", session?.user?.username || "");

    setLoading(true);
    try {
      const response = await fetch(`/api/hr/documents/resubmit?id=${documentId}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(
          errorData.error || "An error occurred while resubmitting the document."
        );
        return;
      }

      const result = await response.json();
      setSuccess(`Document resubmitted successfully: ${result.filename}`);
      setFile(null);
      await fetchDocuments();
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-emerald-400';
      case 'rejected':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div>

      <div className="relative max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Document Management Portal
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Upload, manage, and track your documents submission and verification process.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 transition-all duration-300 hover:border-slate-600/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full h-48 opacity-0 cursor-pointer absolute inset-0 z-10"
              />
              <div className="h-48 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-800/30 group-hover:bg-slate-800/50 group-hover:border-slate-600 transition-all duration-300">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <FileUp className="w-16 h-16 mx-auto text-slate-500 group-hover:text-slate-400 transition-colors" />
                    <div className="absolute inset-0 animate-ping opacity-30">
                      <FileUp className="w-16 h-16 mx-auto text-slate-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 group-hover:text-slate-300">
                      {file ? file.name : "Drop your document here or click to browse"}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Supported formats: PDF, DOC, DOCX (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {file && isRenaming && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
                <p className="text-slate-400 mb-3">Customize filename according to ducument's type ie, Adhaar Card, Pan Card, Reprts etc.</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                    placeholder="Enter new filename"
                  />
                  <button
                    type="button"
                    onClick={handleRename}
                    className="px-6 py-2.5 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Rename
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!!file && isRenaming)}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                loading || (!!file && isRenaming)
                  ? "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {loading ? (
                <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
              ) : (
                "Upload Document"
              )}
            </button>
          </form>

          {(error || success) && (
            <div className={`mt-6 p-4 rounded-xl backdrop-blur-md ${
              error ? "bg-red-900/20 border border-red-700/30" : "bg-emerald-900/20 border border-emerald-700/30"
            }`}>
              <div className="flex items-center gap-3">
                {error ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <p className={error ? "text-red-300" : "text-emerald-300"}>
                  {error || success}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Recent Submissions
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-4 px-6 text-slate-400 font-medium">Document</th>
                  <th className="text-left py-4 px-6 text-slate-400 font-medium">Date</th>
                  <th className="text-left py-4 px-6 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-4 px-6 text-slate-400 font-medium">Notes</th>
                  <th className="text-left py-4 px-6 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr key={doc.id} className="group hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
                          <span className="text-slate-300 group-hover:text-slate-200">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(doc.dateSubmitted).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {doc.rejectionReason || "—"}
                      </td>
                      <td className="py-4 px-6">
                        {doc.status === "Rejected" && (
                          <button
                            onClick={() => handleResubmit(doc.id)}
                            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
                          >
                            Resubmit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No documents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === 1
                  ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                  : "bg-slate-700 text-slate-200 hover:bg-slate-600"
              }`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === totalPages
                  ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                  : "bg-slate-700 text-slate-200 hover:bg-slate-600"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
