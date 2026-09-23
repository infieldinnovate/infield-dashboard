import React from 'react';
import { Toaster } from 'sonner';
import './globals.scss';
import DashboardLayout from '../components/Layout/DashboardLayout';

export const metadata = {
  title: 'POS Pro - Point of Sale',
  description: 'Modern point of sale system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DashboardLayout>{children}</DashboardLayout>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
