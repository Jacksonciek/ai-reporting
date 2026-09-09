import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";

interface DocumentItem {
  id: string;
  filename: string;
  status: string;
  uploaded_at: string;
}

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [loading, setLoading] = useState(false);

  const loadDocuments = async () => {
    const res = await api.get<DocumentItem[]>("/documents");
    setDocuments(res.data);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    setLoading(true);
    try {
      await api.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSelectedFile(null);
      await loadDocuments();
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (event: FormEvent) => {
    event.preventDefault();
    if (!renameId) return;
    await api.patch(`/documents/${renameId}`, { filename: renameValue });
    setRenameId(null);
    setRenameValue("");
    await loadDocuments();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus dokumen ini?")) return;
    await api.delete(`/documents/${id}`);
    await loadDocuments();
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Document Management</h2>
      <form onSubmit={handleUpload} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <input type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={handleFileChange} />
        <button className="primary-button" type="submit" disabled={loading || !selectedFile}>
          Upload
        </button>
      </form>
      <table className="table" style={{ marginTop: "24px" }}>
        <thead>
          <tr>
            <th>Filename</th>
            <th>Status</th>
            <th>Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>
                {renameId === doc.id ? (
                  <form onSubmit={handleRename} style={{ display: "flex", gap: "8px" }}>
                    <input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
                    <button className="primary-button" type="submit">Save</button>
                    <button type="button" onClick={() => setRenameId(null)}>Cancel</button>
                  </form>
                ) : (
                  doc.filename
                )}
              </td>
              <td>{doc.status}</td>
              <td>{dayjs(doc.uploaded_at).format("DD MMM YYYY HH:mm")}</td>
              <td style={{ display: "flex", gap: "8px" }}>
                {renameId !== doc.id && (
                  <button className="primary-button" type="button" onClick={() => {
                    setRenameId(doc.id);
                    setRenameValue(doc.filename);
                  }}>
                    Rename
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(doc.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentsPage;
