import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

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

  const fetchDocuments = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/hr/documents?submittedBy=${session.user.username}&page=${page}`);
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
        setError(errorData.error || "An error occurred while uploading the document.");
        return;
      }

      const result = await response.json();
      setSuccess(`Document submitted successfully: ${result.filename}`);
      setFile(null);
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
        setError(errorData.error || "An error occurred while resubmitting the document.");
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

  return (
    <div className="min-h-screen bg-black bg-opacity-20 text-gray-100 p-6 md:p-8">
      <div className="max-w-3xl mx-auto bg-opacity-80 bg-black rounded-lg shadow-lg p-8 backdrop-blur-md">
        <h1 className="text-3xl font-semibold text-center mb-6 text-white">Submit Document</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full p-4 rounded-lg bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:outline-none transition"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        {success && <p className="text-green-500 mt-4 text-center">{success}</p>}
      </div>

      <h2 className="text-2xl font-semibold mt-10 text-center text-white">Submitted Documents</h2>
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-gray-800 text-white border-collapse rounded-lg">
          <thead>
            <tr>
              <th className="border-b-2 border-gray-600 p-4 text-left">Filename</th>
              <th className="border-b-2 border-gray-600 p-4 text-left">Date Submitted</th>
              <th className="border-b-2 border-gray-600 p-4 text-left">Status</th>
              <th className="border-b-2 border-gray-600 p-4 text-left">Rejection Reason</th>
              <th className="border-b-2 border-gray-600 p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-700 transition duration-200">
                  <td className="border-b border-black-600 p-4">{doc.filename}</td>
                  <td className="border-b border-black-600 p-4">{new Date(doc.dateSubmitted).toLocaleString()}</td>
                  <td className="border-b border-black-600 p-4">{doc.status}</td>
                  <td className="border-b border-black-600 p-4">{doc.rejectionReason || "N/A"}</td>
                  <td className="border-b border-black-600 p-4">
                    {doc.status === "Rejected" && (
                      <button
                        onClick={() => handleResubmit(doc.id)}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition duration-200"
                      >
                        Resubmit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border-b border-gray-600 p-4 text-center text-gray-400">
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-6 gap-6">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition duration-200"
        >
          Previous
        </button>
        <span className="text-white">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}
