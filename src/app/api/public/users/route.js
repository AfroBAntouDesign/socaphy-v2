// src/app/api/public/users/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    // Public view: only members with a public role, limited fields
    const users = await User.find({
      role: { $in: ["adminSOCAphy", "superAdmin"] },
      status: "active",
    })
      .sort({ role: 1, name: 1 })
      .limit(50)
      .select("name avatar role profession description")
      .lean();

    return NextResponse.json({
      users: users.map((u) => ({
        _id: u._id.toString(),
        name: u.name,
        avatar: u.avatar || null,
        role: u.role,
        profession: u.profession || null,
        description: u.description || null,
      })),
    });
  } catch (err) {
    console.error("public/users:", err);
    return NextResponse.json({ users: [] }, { status: 200 });
  }
}