import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ship List",
  description: "Save a launch checklist with project name, readiness count, note, wallet, and timestamp on Base before shipping.",
};

const configuredBaseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID?.trim();
const baseAppId =
  configuredBaseAppId && !configuredBaseAppId.includes("replace_with")
    ? configuredBaseAppId
    : undefined;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>{baseAppId ? <meta name="base:app_id" content={baseAppId} /> : null}</head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
