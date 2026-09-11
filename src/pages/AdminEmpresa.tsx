import { useEffect, useState } from "react";
import { Building2, MapPinned } from "lucide-react";
import { AssetDropzone } from "../components/admin/AssetDropzone";
import * as api from "../lib/api";
import { blobToDataUrl, preparePlanFile } from "../lib/plan-file";
import { useStore } from "../lib/store";

export function AdminEmpresa() {
  const { company, projects, currentProject, setCurrentProjectId, refresh } = useStore();
  const [name, setName] = useState(company?.name || "");
  const [ruc, setRuc] = useState(company?.ruc || "");
  const [phone, setPhone] = useState(company?.phone || "");
  const [projectName, setProjectName] = useState("");
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [newPlan, setNewPlan] = useState<File | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState("");
  const [newPlanPreview, setNewPlanPreview] = useState("");
  const [busy, setBusy] = useState<"company" | "logo" | "plan" | "create" | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!company) return;
    setName(company.name);
    setRuc(company.ruc);
    setPhone(company.phone || "");
  }, [company]);

  function showOk(text: string) {
    setError("");
    setMessage(text);
  }

  function showError(err: unknown) {
    setMessage("");
    setError(err instanceof Error ? err.message : "No se pudo guardar");
  }

  async function saveCompany() {
    setBusy("company");
    try {
      await api.updateCompany({ name, ruc, phone });
      await refresh();
      showOk("Empresa actualizada. El RUC y el teléfono aparecerán en la cotización.");
    } catch (err) {
      showError(err);
    } finally {
      setBusy("");
    }
  }

  async function uploadCompanyLogo(file: File) {
    setBusy("company");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const logoUrl = await api.persistAsset(`company/logo.${ext}`, file, file.type || "image/png");
      await api.updateCompany({ logoUrl });
      await refresh();
      showOk("Logo de empresa actualizado");
    } catch (err) {
      showError(err);
    } finally {
      setBusy("");
    }
  }

  async function uploadProjectLogo(file: File) {
    if (!currentProject) return;
    setBusy("logo");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const logoUrl = await api.persistAsset(
        `projects/${currentProject.id}/logo.${ext}`,
        file,
        file.type || "image/png",
      );
      await api.updateProject(currentProject.id, { logoUrl });
      await refresh();
      showOk("Logo del proyecto actualizado");
    } catch (err) {
      showError(err);
    } finally {
      setBusy("");
    }
  }

  async function uploadProjectPlan(file: File) {
    if (!currentProject) return;
    setBusy("plan");
    try {
      const plan = await preparePlanFile(file);
      const planUrl = await api.persistAsset(
        `projects/${currentProject.id}/plan.${plan.ext}`,
        plan.blob,
        plan.contentType,
      );
      await api.updateProject(currentProject.id, { planUrl });
      await refresh();
      showOk(plan.fromPdf ? "PDF convertido a imagen y guardado como plano." : "Plano actualizado");
    } catch (err) {
      showError(err);
    } finally {
      setBusy("");
    }
  }

  async function addProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create");
    try {
      const created = await api.createProject({
        name: projectName,
        logoFile: newLogo,
        planFile: newPlan,
      });
      setProjectName("");
      setNewLogo(null);
      setNewPlan(null);
      setNewLogoPreview("");
      setNewPlanPreview("");
      setCurrentProjectId(created.id);
      await refresh();
      showOk("Proyecto creado. Ahora carga lotes en Precios y dibuja el mapa.");
    } catch (err) {
      showError(err);
    } finally {
      setBusy("");
    }
  }

  async function pickNewPlan(file: File) {
    setBusy("create");
    try {
      const plan = await preparePlanFile(file);
      setNewPlan(file);
      setNewPlanPreview(await blobToDataUrl(plan.blob));
      setError("");
    } catch (err) {
      setNewPlan(null);
      setNewPlanPreview("");
      showError(err);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <section className="app-card h-fit">
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-brand-gold" />
          <h1 className="text-xl font-semibold">Empresa</h1>
        </div>
        <label className="mb-3 block text-sm">
          Nombre
          <input className="app-input" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="mb-3 block text-sm">
          RUC
          <input className="app-input" value={ruc} onChange={(event) => setRuc(event.target.value)} placeholder="Ingresa el RUC para la cotización" />
        </label>
        <label className="mb-4 block text-sm">
          Número de teléfono de la empresa
          <input className="app-input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ej. 044 123 456 / 999 888 777" />
        </label>
        <AssetDropzone
          label="Logo de la empresa"
          hint="PNG o JPG. Se muestra en la cotización."
          accept="image/*"
          busy={busy === "company"}
          preview={company?.logoUrl ? <img src={company.logoUrl} alt="" className="max-h-32 object-contain" /> : undefined}
          onFile={(file) => void uploadCompanyLogo(file)}
        />
        <button
          className="mt-4 rounded-lg bg-brand-navy px-4 py-2 text-white disabled:opacity-60"
          disabled={busy === "company"}
          onClick={() => void saveCompany()}
        >
          Guardar empresa
        </button>
      </section>

      <section className="app-card space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPinned size={18} className="text-brand-gold" />
            <div>
              <h2 className="text-xl font-semibold">Proyectos</h2>
              <p className="text-sm text-[var(--muted)]">Logo, plano e imagen o PDF de lotización</p>
            </div>
          </div>
          {projects.length > 0 && (
            <label className="text-sm">
              Proyecto actual
              <select
                className="app-input mt-1 min-w-56"
                value={currentProject?.id || ""}
                onChange={(event) => setCurrentProjectId(event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {currentProject && (
          <div className="rounded-2xl border border-[var(--line)] p-4">
            <p className="mb-4 text-lg font-medium">{currentProject.name}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <AssetDropzone
                label="Logo del proyecto"
                hint="PNG o JPG cuadrado, con fondo transparente si es posible."
                accept="image/*"
                busy={busy === "logo"}
                preview={
                  currentProject.logoUrl ? (
                    <img src={currentProject.logoUrl} alt="Logo del proyecto" className="max-h-32 object-contain" />
                  ) : undefined
                }
                onFile={(file) => void uploadProjectLogo(file)}
              />
              <AssetDropzone
                label="Plano de lotización"
                hint="Imagen (JPG/PNG) o PDF. Si es PDF, se usa la primera página como plano nítido."
                accept="image/*,application/pdf,.pdf"
                busy={busy === "plan"}
                preview={
                  currentProject.planUrl ? (
                    <img src={currentProject.planUrl} alt="Plano del proyecto" className="h-full w-full object-contain" />
                  ) : undefined
                }
                onFile={(file) => void uploadProjectPlan(file)}
              />
            </div>
          </div>
        )}

        <form className="space-y-4 rounded-2xl border border-[var(--line)] p-4" onSubmit={(event) => void addProject(event)}>
          <div>
            <h3 className="font-semibold">Agregar otro proyecto</h3>
            <p className="text-sm text-[var(--muted)]">Nombre, logo y plano. El plano puede ser imagen o PDF.</p>
          </div>
          <label className="block text-sm">
            Nombre del proyecto
            <input
              className="app-input"
              placeholder="Ej. Campo Verde Residencial"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <AssetDropzone
              label="Logo"
              hint="Opcional. PNG o JPG."
              accept="image/*"
              preview={newLogoPreview ? <img src={newLogoPreview} alt="" className="max-h-32 object-contain" /> : undefined}
              fileName={newLogo?.name}
              onFile={(file) => {
                setNewLogo(file);
                setNewLogoPreview(URL.createObjectURL(file));
              }}
            />
            <AssetDropzone
              label="Plano (imagen o PDF)"
              hint="Opcional. El PDF se convierte a imagen al elegir el archivo."
              accept="image/*,application/pdf,.pdf"
              busy={busy === "create"}
              preview={newPlanPreview ? <img src={newPlanPreview} alt="" className="h-full w-full object-contain" /> : undefined}
              fileName={newPlan?.name}
              onFile={(file) => void pickNewPlan(file)}
            />
          </div>
          <button className="rounded-lg bg-brand-green px-4 py-2 text-white disabled:opacity-60" disabled={busy === "create"}>
            {busy === "create" ? "Creando..." : "Crear proyecto"}
          </button>
        </form>

        {message && <p className="text-sm text-brand-green">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>
    </div>
  );
}
