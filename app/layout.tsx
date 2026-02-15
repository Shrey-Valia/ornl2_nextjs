import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SettingsProvider } from "@/app/context/SettingsContext";
import { MainLayout } from "@/app/components/MainLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ORNL Neural Networks - Polymer Growth",
  description: "ML-powered batch reactor optimization and yield prediction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SettingsProvider>
          <MainLayout>{children}</MainLayout>
        </SettingsProvider>
      </body>
    </html>
  );
}