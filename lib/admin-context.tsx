"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Toast, { type ToastType } from "@/components/team/Toast";

const AdminKeyContext = createContext("");
const AdminToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});

export function AdminKeyProvider({
  adminKey,
  children,
}: {
  adminKey: string;
  children: React.ReactNode;
}) {
  return <AdminKeyContext.Provider value={adminKey}>{children}</AdminKeyContext.Provider>;
}

export function useAdminKey() {
  return useContext(AdminKeyContext);
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
  }, []);

  return (
    <AdminToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  return useContext(AdminToastContext);
}
