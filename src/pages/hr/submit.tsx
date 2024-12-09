import { useState, useEffect } from "react";
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

  const fetchDocuments = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/hr/documents?submittedBy=${session.user.username}`);
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load documents.");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [session]);

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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-4">Submit HR Document</h1>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4 w-full border border-gray-600 rounded p-2 bg-gray-700 text-gray-200"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        {success && <p className="text-green-500 mt-4 text-center">{success}</p>}
      </div>

      <h2 className="text-2xl font-bold mt-8 text-center">Submitted Documents</h2>
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-gray-800 border border-gray-600 rounded-lg">
          <thead>
            <tr>
              <th className="border-b-2 border-gray-600 p-2 text-left">Filename</th>
              <th className="border-b-2 border-gray-600 p-2 text-left">Date Submitted</th>
              <th className="border-b-2 border-gray-600 p-2 text-left">Status</th>
              <th className="border-b-2 border-gray-600 p-2 text-left">Rejection Reason</th>
              <th className="border-b-2 border-gray-600 p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-700 transition duration-200">
                <td className="border-b border-gray-600 p-2">{doc.filename}</td>
                <td className="border-b border-gray-600 p-2">{new Date(doc.dateSubmitted).toLocaleString()}</td>
                <td className="border-b border-gray-600 p-2">{doc.status}</td>
                <td className="border-b border-gray-600 p-2">{doc.rejectionReason || "N/A"}</td>
                <td className="border-b border-gray-600 p-2">
                  {doc.status === "Rejected" && (
                    <button
                      onClick={() => handleResubmit(doc.id)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition duration-200"
                    >
                      Resubmit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}