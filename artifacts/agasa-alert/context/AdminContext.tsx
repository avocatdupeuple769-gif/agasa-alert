import React, { createContext, useContext } from "react";

interface AdminContextValue {
  isAuthenticated: boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  return (
    <AdminContext.Provider value={{ isAuthenticated: true, logout: () => {} }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
