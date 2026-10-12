// src/app/adminDashboard/manageCjp/info/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { connectDB } from "@/lib/db";
import JournalInfo from "@/models/JournalInfo";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import AdminHeader from "@/components/admin/AdminHeader";
import InfoForm from "./InfoForm";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Informations du journal | Admin CJP",
};

export default async function ManageCjpInfoPage() {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  await connectDB();
  const info = await JournalInfo.findOne({ _key: "singleton" }).lean();
  const initial = info ? JSON.parse(JSON.stringify(info)) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/adminDashboard/manageCjp"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Journal CJP
      </Link>

      <AdminHeader
        title="Informations du journal"
        subtitle="Masthead, descriptions, instructions et politiques"
      />

      <InfoForm initial={initial} />
    </div>
  );
}
