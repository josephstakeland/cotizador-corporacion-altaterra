import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Map, Table2, Building2, Users, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm ${isActive ? "bg-white text-brand-navy" : "text-white/85 hover:bg-white/10"}`;

export function Layout() {
  const { user, logout } = useAuth();
  const { projects, currentProject, setCurrentProjectId, company } = useStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={company?.logoUrl || "/logos/altaterra.png"} alt="Altaterra" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-sm font-semibold">Cotizador Altaterra</p>
              <p className="text-xs text-white/70">{currentProject?.name || "Sin proyecto"}</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={linkClass}>
              <span className="inline-flex items-center gap-1">
                <FileSpreadsheet size={14} /> Cotizador
              </span>
            </NavLink>
            {user?.role === "admin" && (
              <>
                <NavLink to="/admin/mapa" className={linkClass}>
                  <span className="inline-flex items-center gap-1">
                    <Map size={14} /> Mapa
                  </span>
                </NavLink>
                <NavLink to="/admin/precios" className={linkClass}>
                  <span className="inline-flex items-center gap-1">
                    <Table2 size={14} /> Precios
                  </span>
                </NavLink>
                <NavLink to="/admin/empresa" className={linkClass}>
                  <span className="inline-flex items-center gap-1">
                    <Building2 size={14} /> Empresa
                  </span>
                </NavLink>
                <NavLink to="/admin/usuarios" className={linkClass}>
                  <span className="inline-flex items-center gap-1">
                    <Users size={14} /> Usuarios
                  </span>
                </NavLink>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {projects.length > 1 && (
              <select
                className="rounded-full bg-white/10 px-3 py-1.5 text-sm"
                value={currentProject?.id || ""}
                onChange={(event) => setCurrentProjectId(event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
            <span className="text-xs text-white/80">
              {user?.fullName} · {user?.role}
            </span>
            <button
              className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              title="Salir"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}
