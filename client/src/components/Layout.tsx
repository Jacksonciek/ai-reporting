import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.roles?.includes("admin");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <header>AI Reporting Copilot</header>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
            Chatbot
          </NavLink>
          {isAdmin && (
            <NavLink to="/documents" className={({ isActive }) => (isActive ? "active" : undefined)}>
              Documents
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/transactions" className={({ isActive }) => (isActive ? "active" : undefined)}>
              Transactions
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/logs" className={({ isActive }) => (isActive ? "active" : undefined)}>
              Audit Logs
            </NavLink>
          )}
        </nav>
        <footer>
          <div style={{ fontSize: "0.85rem", marginBottom: "8px" }}>{user?.email}</div>
          <button className="primary-button" style={{ width: "100%" }} onClick={logout}>
            Logout
          </button>
        </footer>
      </aside>
      <main className="content">
        <Outlet key={location.key} />
      </main>
    </div>
  );
};

export default Layout;
