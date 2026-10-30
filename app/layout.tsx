// app\layout.tsx

import React from "react";
import { Toaster } from "sonner";
import "/styles/globals.scss";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import { AuthProvider } from "./providers";
import AuthDevIndicator from "../components/dev/AuthDevIndicator";

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
  const isDevIndicatorVisible = user !== null && process.env.NODE_ENV === "development";
  return (
    <html lang="en">
      <body>
        <AuthProvider user={user}>
          <DashboardLayout>{children}</DashboardLayout>
          <AuthDevIndicator enabled={isDevIndicatorVisible} />
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
