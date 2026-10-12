// src/app/adminDashboard/manageCjp/board/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { connectDB } from "@/lib/db";
import JournalBoardMember from "@/models/JournalBoardMember";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import AdminHeader from "@/components/admin/AdminHeader";
import BoardManager from "./BoardManager";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Comité éditorial | Admin CJP",
};

export default async function ManageCjpBoardPage() {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  await connectDB();
  const members = await JournalBoardMember.find()
    .sort({ role: 1, order: 1, name: 1 })
    .lean();

  const initialMembers = members.map((m) => ({
    _id: m._id.toString(),
    name: m.name,
    title: m.title || "",
    role: m.role,
    affiliation: m.affiliation || "",
    email: m.email || "",
    orcid: m.orcid || "",
    photo: m.photo || "",
    biography: m.biography || "",
    order: m.order ?? 0,
    isActive: m.isActive !== false,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/adminDashboard/manageCjp"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Journal CJP
      </Link>

      <AdminHeader
        title="Comité éditorial"
        subtitle="Éditeur en chef, éditeurs, comité et secrétariat"
      />

      <BoardManager initialMembers={initialMembers} />
    </div>
  );
}
