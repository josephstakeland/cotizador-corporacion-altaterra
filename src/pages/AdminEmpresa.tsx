import { useEffect, useState } from "react";
import * as api from "../lib/api";
import { fileToDataUrl } from "../lib/money";
import { useStore } from "../lib/store";

export function AdminEmpresa() {
  const { company, currentProject, refresh } = useStore();
  const [name, setName] = useState(company?.name || "");
  const [ruc, setRuc] = useState(company?.ruc || "");

  useEffect(() => {
    if (company) {
      setName(company.name);
      setRuc(company.ruc);
    }
  }, [company]);
  const [projectName, setProjectName] = useState("");
  const [message, setMessage] = useState("");

  async function saveCompany() {
    await api.updateCompany({ name, ruc });
    await refresh();
    setMessage("Empresa actualizada. El RUC aparecerá en la cotización.");
  }

  async function uploadCompanyLogo(file: File) {
    const logoUrl = await fileToDataUrl(file);
    await api.updateCompany({ logoUrl });
    await refresh();
  }

  async function uploadProjectAsset(kind: "logoUrl" | "planUrl", file: File) {
    if (!currentProject) return;
    const url = await fileToDataUrl(file);
    await api.updateProject(currentProject.id, { [kind]: url });
    await refresh();
    setMessage(kind === "planUrl" ? "Plano actualizado" : "Logo de proyecto actualizado");
  }

  async function addProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const logo = (form.elements.namedItem("logo") as HTMLInputElement).files?.[0];
    const plan = (form.elements.namedItem("plan") as HTMLInputElement).files?.[0];
    await api.createProject({ name: projectName, logoFile: logo, planFile: plan });
    setProjectName("");
    await refresh();
    setMessage("Proyecto creado. Ahora carga lotes en Precios y dibuja el mapa.");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="app-card">
        <h1 className="mb-4 text-xl font-semibold">Empresa</h1>
        <label className="mb-3 block text-sm">
          Nombre
          <input className="app-input" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="mb-3 block text-sm">
          RUC
          <input className="app-input" value={ruc} onChange={(event) => setRuc(event.target.value)} placeholder="Ingresa el RUC para la cotización" />
        </label>
        <label className="mb-4 block text-sm">
          Logo de la empresa
          <input className="mt-1 block" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void uploadCompanyLogo(event.target.files[0])} />
        </label>
        {company?.logoUrl && <img src={company.logoUrl} alt="" className="mb-4 h-20 object-contain" />}
        <button className="rounded-lg bg-brand-navy px-4 py-2 text-white" onClick={() => void saveCompany()}>
          Guardar empresa
        </button>
      </section>

      <section className="app-card">
        <h2 className="mb-4 text-xl font-semibold">Proyecto actual</h2>
        {currentProject && (
          <>
            <p className="mb-3 font-medium">{currentProject.name}</p>
            <label className="mb-3 block text-sm">
              Logo del proyecto
              <input className="mt-1 block" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void uploadProjectAsset("logoUrl", event.target.files[0])} />
            </label>
            <label className="mb-3 block text-sm">
              Plano
              <input className="mt-1 block" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void uploadProjectAsset("planUrl", event.target.files[0])} />
            </label>
            <div className="flex gap-4">
              {currentProject.logoUrl && <img src={currentProject.logoUrl} alt="" className="h-20 object-contain" />}
              {currentProject.planUrl && <img src={currentProject.planUrl} alt="" className="h-24 rounded border object-cover" />}
            </div>
          </>
        )}

        <form className="mt-6 space-y-3 border-t pt-4" onSubmit={(event) => void addProject(event)}>
          <h3 className="font-semibold">Agregar otro proyecto</h3>
          <input className="app-input" placeholder="Nombre del proyecto" value={projectName} onChange={(event) => setProjectName(event.target.value)} required />
          <input name="logo" type="file" accept="image/*" />
          <input name="plan" type="file" accept="image/*" />
          <button className="rounded-lg bg-brand-green px-4 py-2 text-white">Crear proyecto</button>
        </form>
        {message && <p className="mt-3 text-sm text-brand-green">{message}</p>}
      </section>
    </div>
  );
}
