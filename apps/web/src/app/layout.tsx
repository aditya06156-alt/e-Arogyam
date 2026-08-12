import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'e-Arogyam — Pharmaceutical Cold-Chain & Inventory Management System, Gorakhpur',
  description: 'e-Arogyam: Real-time pharmaceutical cold-chain monitoring and inventory management for Gorakhpur district hospitals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-govt-gray text-govt-text font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
