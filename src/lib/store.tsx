import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as api from "./api";
import type { Company, Lot, Project, Quote } from "./types";

type StoreContextValue = {
  company: Company | null;
  projects: Project[];
  lots: Lot[];
  quotes: Quote[];
  currentProject: Project | null;
  setCurrentProjectId: (id: string) => void;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [nextCompany, nextProjects, nextLots, nextQuotes] = await Promise.all([
      api.getCompany(),
      api.listProjects(),
      api.listLots(),
      api.listQuotes(),
    ]);
    setCompany(nextCompany);
    setProjects(nextProjects);
    setLots(nextLots);
    setQuotes(nextQuotes);
    setCurrentProjectId((current) => current || nextProjects[0]?.id || null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const currentProject = useMemo(
    () => projects.find((project) => project.id === currentProjectId) || projects[0] || null,
    [projects, currentProjectId],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      company,
      projects,
      lots: currentProject ? lots.filter((lot) => lot.projectId === currentProject.id) : lots,
      quotes: currentProject ? quotes.filter((quote) => quote.projectId === currentProject.id) : quotes,
      currentProject,
      setCurrentProjectId,
      refresh,
    }),
    [company, projects, lots, quotes, currentProject, refresh],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore debe usarse dentro de StoreProvider");
  return context;
}
