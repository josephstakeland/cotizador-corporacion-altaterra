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
    <div className="flex min-h-dvh items-center justify-center px-4" style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}>
      <div className="app-card w-full max-w-md p-8">
        <div className="mb-6 flex items-center justify-center gap-6">
          <img src="/logos/altaterra.png" alt="Altaterra" className="h-16 object-contain sm:h-20" />
          <img src="/logos/bosques-del-sol-ii.png" alt="Bosques del Sol II" className="h-16 object-contain sm:h-20" />
        </div>
        <h1 className="text-center text-2xl font-semibold">Cotizador Altaterra</h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">Bosques del Sol II</p>
        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === "register" && (
            <input className="app-input mt-0" placeholder="Nombre completo" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          )}
          <input className="app-input mt-0" type="email" placeholder="Correo" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <input className="app-input mt-0" type="password" placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="app-btn w-full bg-white text-brand-navy">
            {loading ? "Ingresando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>
        <button className="mt-4 w-full text-sm text-sky-300" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Crear cuenta de asesor" : "Ya tengo cuenta"}
        </button>
      </div>
    </div>
  );
}
