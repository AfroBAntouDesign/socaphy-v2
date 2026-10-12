// src/components/admin/AdminHeader.js
import Link from "next/link";

export default function AdminHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Console d'administration
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}