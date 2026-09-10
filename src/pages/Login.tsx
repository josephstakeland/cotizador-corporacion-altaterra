import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Login() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.role === "admin") return <Navigate to="/admin/mapa" replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const profile = await login(email, password);
      if (profile.role !== "admin") {
        await logout();
        setError("Este acceso es solo para administradores.");
        return;
      }
      navigate("/admin/mapa");
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
        <h1 className="text-center text-2xl font-semibold">Administración</h1>
        <p className="mb-6 text-center text-sm text-[var(--muted)]">Ingresa con tu usuario y contraseña de administrador</p>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input className="app-input mt-0" type="email" placeholder="Usuario / correo" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" />
          <input className="app-input mt-0" type="password" placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="app-btn w-full bg-white text-brand-navy">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <button type="button" className="mt-4 w-full text-sm text-sky-300" onClick={() => navigate("/")}>
          Volver al cotizador
        </button>
      </div>
    </div>
  );
}
