import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import AppShell from "@/components/AppShell";
import "./globals.css";

async function getSessionUser() {
  // ✅ Next.js 15: cookies() is async — must be awaited
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await verifyToken(token);
  if (!session) return null;

  await connectDB();
  const u = await User.findById(session.sub).select("-password").lean();
  if (!u) return null;

  return {
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
  };
}

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