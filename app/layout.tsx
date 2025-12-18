import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Rutinup - Gestión de Gimnasios',
  description: 'Software SaaS para gestión de gimnasios pequeños y medianos',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="bg-black">
      <body className="bg-dark-900 text-gray-100">
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

