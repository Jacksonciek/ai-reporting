import { FormEvent, useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  sender_type: "user" | "bot";
  content: string;
  created_at: string;
}

interface DocumentItem {
  id: string;
  filename: string;
  status: string;
}

const ChatPage = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    const res = await api.get<ChatSession[]>("/conversation_chatbots");
    setSessions(res.data);
    if (!selectedSession && res.data.length > 0) {
      setSelectedSession(res.data[0]);
    }
  };

  const loadDocuments = async () => {
    const res = await api.get<DocumentItem[]>("/documents");
    setDocuments(res.data.filter((doc) => doc.status === "processed"));
  };

  useEffect(() => {
    loadSessions();
    loadDocuments();
  }, []);

  const handleCreateSession = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    try {
      setLoading(true);
      const res = await api.post("/conversation_chatbots", {
        title: `Chat ${dayjs().format("DD MMM YYYY HH:mm")}`,
        message,
        document_ids: selectedDocuments
      });
      setMessage("");
      await loadSessions();
      setSelectedSession(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSession || !message.trim()) return;
    try {
      setLoading(true);
      await api.post(`/conversation_chatbots/${selectedSession.id}/messages`, {
        message,
        document_ids: selectedDocuments
      });
      setMessage("");
      const updated = await api.get<ChatSession>(`/conversation_chatbots/${selectedSession.id}`);
      setSelectedSession(updated.data);
      await loadSessions();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    const res = await api.get<ChatSession>(`/conversation_chatbots/${sessionId}`);
    setSelectedSession(res.data);
  };

  const onSubmit = selectedSession ? handleSendMessage : handleCreateSession;

  return (
    <div className="card" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "24px" }}>
      <div>
        <h2 style={{ marginTop: 0 }}>History</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sessions.map((session) => (
            <button
              key={session.id}
              className="primary-button"
              style={{
                background: selectedSession?.id === session.id ? "#1d4ed8" : "#334155",
                textAlign: "left"
              }}
              onClick={() => handleSelectSession(session.id)}
            >
              <div style={{ fontWeight: 600 }}>{session.title}</div>
              <div style={{ fontSize: "0.8rem" }}>{dayjs(session.created_at).format("DD MMM YYYY HH:mm")}</div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: "24px" }}>
          <h3>Select documents</h3>
          <select
            multiple
            value={selectedDocuments}
            onChange={(event) => {
              const options = Array.from(event.target.selectedOptions).map((opt) => opt.value);
              setSelectedDocuments(options);
            }}
            style={{ width: "100%", minHeight: "140px" }}
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.filename}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <form onSubmit={onSubmit} className="chat-window">
          <div className="chat-messages">
            {selectedSession?.messages?.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender_type}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <textarea
              value={message}
              placeholder="Tulis pertanyaan kamu di sini..."
              onChange={(event) => setMessage(event.target.value)}
            />
            <button type="submit" className="primary-button" disabled={loading}>
              {selectedSession ? "Send" : "Start"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
