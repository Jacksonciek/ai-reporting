import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";

interface AuditLogItem {
  id: string;
  created_at: string;
  description: string;
}

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    api.get<AuditLogItem[]>("/logs").then((res) => setLogs(res.data));
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Audit Logs</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{dayjs(log.created_at).format("DD MMM YYYY HH:mm")}</td>
              <td>{log.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogsPage;
