import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      login(token, user);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}>
      <form className="card" style={{ width: "360px" }} onSubmit={handleSubmit}>
        <h2>Masuk ke Copilot</h2>
        {error && <div style={{ color: "#b91c1c", marginBottom: "12px" }}>{error}</div>}
        <div className="form-control">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="form-control">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p style={{ fontSize: "0.85rem", marginTop: "16px" }}>
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
