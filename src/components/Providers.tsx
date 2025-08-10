// src/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "./ToastContext";
import { ReactNode } from "react";
import { RecruiterProProvider } from "@/contexts/RecruiterProContext";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ToastProvider>
          <RecruiterProProvider>{children}</RecruiterProProvider>
        </ToastProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
