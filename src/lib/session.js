import { cache } from "react";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const getSessionUser = cache(async () => {
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
});