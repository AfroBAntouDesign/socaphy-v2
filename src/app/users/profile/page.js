// src/app/users/profile/page.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import ProfileClient from "@/components/profile/ProfileClient";

async function getSessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
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
    description: u.description,
    biography: u.biography,
    phone: u.phone,
    address: u.address,
    createdAt: u.createdAt,
  };
}

export const metadata = {
  title: "Mon profil | SOCAphy",
};

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/users/profile");

  return <ProfileClient initialUser={user} />;
}