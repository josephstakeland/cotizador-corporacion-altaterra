import { useEffect, useState } from "react";
import * as api from "../lib/api";
import type { Profile, Role } from "../lib/types";

export function AdminUsuarios() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setProfiles(await api.listProfiles());
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeRole(id: string, role: Role) {
    await api.updateProfileRole(id, role);
    await load();
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    await api.createAdvisor(email, password, fullName);
    setEmail("");
    setPassword("");
    setFullName("");
    setMessage("Asesor creado");
    await load();
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold text-brand-navy">Usuarios</h1>
      <form className="mb-6 grid gap-2 md:grid-cols-4" onSubmit={(event) => void create(event)}>
        <input className="rounded border px-3 py-2" placeholder="Nombre" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        <input className="rounded border px-3 py-2" type="email" placeholder="Correo" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input className="rounded border px-3 py-2" type="password" placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button className="rounded bg-brand-navy text-white">Crear asesor</button>
      </form>
      {message && <p className="mb-3 text-sm text-brand-green">{message}</p>}
      <table className="min-w-full text-sm">
        <thead className="bg-brand-navy text-white">
          <tr>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Correo</th>
            <th className="p-2">Rol</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} className="border-b">
              <td className="p-2">{profile.fullName}</td>
              <td className="p-2">{profile.email}</td>
              <td className="p-2">
                <select className="rounded border px-2 py-1" value={profile.role} onChange={(event) => void changeRole(profile.id, event.target.value as Role)}>
                  <option value="admin">Admin</option>
                  <option value="asesor">Asesor</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
