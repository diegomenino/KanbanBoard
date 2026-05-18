import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/queries";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "KanbanBoard",
  description: "Production-minded Kanban board with approvals and an express lane.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const language = user?.preferenceLanguage === "es-AR" ? "es-AR" : "en";
  const theme = user?.preferenceTheme ?? "light";

  return (
    <html
      lang={language}
      data-theme={theme}
      className={bodyFont.variable}
    >
      <body>{children}</body>
    </html>
  );
}
