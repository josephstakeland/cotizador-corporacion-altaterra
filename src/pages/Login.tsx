import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("admin@altaterra.pe");
  const [password, setPassword] = useState("Admin123!");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, fullName);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de acceso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-6">
          <img src="/logos/altaterra.png" alt="Altaterra" className="h-20 object-contain" />
          <img src="/logos/bosques-del-sol-ii.png" alt="Bosques del Sol II" className="h-20 object-contain" />
        </div>
        <h1 className="text-center text-2xl font-semibold text-brand-navy">Cotizador Altaterra</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Bosques del Sol II</p>
        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          )}
          <input
            className="w-full rounded-lg border px-3 py-2"
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border px-3 py-2"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-brand-navy py-2 text-white">
            {loading ? "Ingresando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>
        <button className="mt-4 w-full text-sm text-brand-navy" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Crear cuenta de asesor" : "Ya tengo cuenta"}
        </button>
        <p className="mt-4 text-center text-xs text-slate-500">
          Demo: admin@altaterra.pe / Admin123! · asesor@altaterra.pe / Asesor123!
        </p>
      </div>
    </div>
  );
}
