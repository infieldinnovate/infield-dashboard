// app\layout.tsx

import React from "react";
import { Toaster } from "sonner";
import "/styles/globals.scss";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import { AuthProvider } from "./providers";

export const metadata = {
  title: "POS Pro - Point of Sale",
  description: "Modern point of sale system",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        <AuthProvider user={user}>
          <DashboardLayout>{children}</DashboardLayout>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
