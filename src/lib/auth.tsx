import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { currentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from "./api";
import type { Profile } from "./types";

type AuthContextValue = {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Profile>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    currentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const profile = await apiLogin(email, password);
        setUser(profile);
        return profile;
      },
      register: async (email, password, fullName) => {
        setUser(await apiRegister(email, password, fullName));
      },
      logout: async () => {
        await apiLogout();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
