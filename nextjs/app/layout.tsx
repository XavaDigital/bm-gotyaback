import type { Metadata } from "next";
import { Archivo, Montserrat } from "next/font/google";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AuthProvider } from '@/lib/contexts/auth-context';
import "./globals.css";

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Got Ya Back - Fundraising Platform",
  description: "Create and manage fundraising shirt campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${montserrat.variable}`}>
      <body className="antialiased">
        <AntdRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
