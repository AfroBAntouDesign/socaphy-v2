import AppShell from "@/components/AppShell";
import { getSessionUser } from "@/lib/session";
import "./globals.css";

export default async function RootLayout({ children }) {
  const user = await getSessionUser();

  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900">
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}