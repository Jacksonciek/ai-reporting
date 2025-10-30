import { Navigate, Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import DocumentsPage from "./pages/DocumentsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TransactionsPage from "./pages/TransactionsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

const App = () => {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<ChatPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="logs" element={<AuditLogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
};

export default App;
