import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Building2, FileSpreadsheet, LogOut, Map, Table2, Users } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";
import { useTheme, type ThemeMode } from "../lib/theme";

const themes: { id: ThemeMode; label: string }[] = [
  { id: "light", label: "Claro" },
  { id: "dark", label: "Oscuro" },
  { id: "auto", label: "Auto" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { currentProject } = useStore();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-dvh pb-[calc(4.5rem+var(--safe-bottom))] md:pb-0" style={{ paddingTop: "var(--safe-top)" }}>
      <header className="no-print border-b border-white/10 px-3 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold sm:text-lg">Cotizador Corporación Altaterra</h1>
            <p className="text-xs text-[var(--muted)]">Genera cotizaciones de lotes con descuento comercial y opciones de financiamiento</p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs">
            {themes.map((item) => (
              <button
                key={item.id}
                className={`rounded-full px-3 py-1.5 ${mode === item.id ? "bg-white text-brand-navy" : "text-[var(--muted)]"}`}
                onClick={() => setMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <NavLink to="/" className="app-btn app-btn-primary">
            <FileSpreadsheet size={16} /> Cotizador
          </NavLink>
          <NavLink to="/?plano=1" className="app-btn app-btn-primary">
            <Map size={16} /> Ver plano de lotización
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin/mapa" className={`app-btn ${isAdminPage ? "bg-white text-brand-navy" : "app-btn-primary"}`}>
              Modo administrador
            </NavLink>
          )}
          <span className="ml-auto hidden text-xs text-[var(--muted)] sm:inline">
            {user?.fullName} · {user?.role} · {currentProject?.name}
          </span>
          <button
            className="app-btn app-btn-primary"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
        {user?.role === "admin" && isAdminPage && (
          <nav className="mt-3 flex flex-wrap gap-2">
            <NavLink to="/admin/mapa" className="app-btn app-btn-primary"><Map size={14} /> Mapa</NavLink>
            <NavLink to="/admin/precios" className="app-btn app-btn-primary"><Table2 size={14} /> Precios</NavLink>
            <NavLink to="/admin/empresa" className="app-btn app-btn-primary"><Building2 size={14} /> Empresa</NavLink>
            <NavLink to="/admin/usuarios" className="app-btn app-btn-primary"><Users size={14} /> Usuarios</NavLink>
          </nav>
        )}
      </header>
      <main className="px-3 py-4 sm:px-5">
        <Outlet />
      </main>
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-[var(--bg)] px-2 pt-2 md:hidden" style={{ paddingBottom: "max(0.5rem, var(--safe-bottom))" }}>
        <NavLink to="/" className="flex flex-col items-center gap-1 py-1 text-[11px]"><FileSpreadsheet size={18} /> Cotizar</NavLink>
        <NavLink to="/?plano=1" className="flex flex-col items-center gap-1 py-1 text-[11px]"><Map size={18} /> Plano</NavLink>
        {user?.role === "admin" ? (
          <NavLink to="/admin/mapa" className="flex flex-col items-center gap-1 py-1 text-[11px]"><Building2 size={18} /> Admin</NavLink>
        ) : (
          <button className="flex flex-col items-center gap-1 py-1 text-[11px]" onClick={() => document.getElementById("quote-paper")?.scrollIntoView({ behavior: "smooth" })}>
            <FileSpreadsheet size={18} /> PDF
          </button>
        )}
      </nav>
    </div>
  );
}
