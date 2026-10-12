// src/app/adminDashboard/manageCjp/issues/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { connectDB } from "@/lib/db";
import JournalIssue from "@/models/JournalIssue";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import AdminHeader from "@/components/admin/AdminHeader";
import IssuesManager from "./IssuesManager";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Volumes & numéros | Admin CJP",
};

export default async function ManageCjpIssuesPage() {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  await connectDB();
  const issues = await JournalIssue.find().sort({ volume: -1, number: -1 }).lean();

  const initialIssues = issues.map((i) => ({
    _id: i._id.toString(),
    volume: i.volume,
    number: i.number,
    year: i.year,
    title: i.title || "",
    editorial: i.editorial || "",
    publishDate: i.publishDate ? i.publishDate.toISOString() : "",
    coverImage: i.coverImage || "",
    status: i.status,
    articleCount: i.articleCount || 0,
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
        title="Volumes & numéros"
        subtitle="Créez et gérez les numéros du journal"
      />

      <IssuesManager initialIssues={initialIssues} />
    </div>
  );
}
