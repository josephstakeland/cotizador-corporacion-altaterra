import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8">Cargando...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
