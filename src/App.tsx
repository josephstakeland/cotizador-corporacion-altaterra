import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RequireAuth } from "./components/RequireAuth";
import { AuthProvider } from "./lib/auth";
import { StoreProvider } from "./lib/store";
import { AdminEmpresa } from "./pages/AdminEmpresa";
import { AdminMapa } from "./pages/AdminMapa";
import { AdminPrecios } from "./pages/AdminPrecios";
import { AdminUsuarios } from "./pages/AdminUsuarios";
import { Cotizador } from "./pages/Cotizador";
import { Login } from "./pages/Login";

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Cotizador />} />
                <Route element={<RequireAuth admin />}>
                  <Route path="/admin/mapa" element={<AdminMapa />} />
                  <Route path="/admin/precios" element={<AdminPrecios />} />
                  <Route path="/admin/empresa" element={<AdminEmpresa />} />
                  <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}
