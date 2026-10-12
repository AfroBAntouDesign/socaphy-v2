// src/components/admin/StatCard.js
const ACCENTS = {
  emerald: {
    ring: "ring-emerald-100",
    bg: "bg-emerald-50",
    icon: "bg-emerald-600",
    text: "text-emerald-800",
    value: "text-emerald-900",
  },
  orange: {
    ring: "ring-orange-100",
    bg: "bg-orange-50",
    icon: "bg-orange-500",
    text: "text-orange-800",
    value: "text-orange-900",
  },
  red: {
    ring: "ring-red-100",
    bg: "bg-red-50",
    icon: "bg-red-500",
    text: "text-red-800",
    value: "text-red-900",
  },
  blue: {
    ring: "ring-blue-100",
    bg: "bg-blue-50",
    icon: "bg-blue-500",
    text: "text-blue-800",
    value: "text-blue-900",
  },
  gray: {
    ring: "ring-gray-200",
    bg: "bg-gray-50",
    icon: "bg-gray-500",
    text: "text-gray-700",
    value: "text-gray-900",
  },
};

export default function StatCard({ label, value, hint, icon: Icon, accent = "emerald" }) {
  const a = ACCENTS[accent] ?? ACCENTS.emerald;

  return (
    <div className={`rounded-xl bg-white p-5 ring-1 ${a.ring} transition hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wide ${a.text}`}>
            {label}
          </p>
          <p className={`mt-2 text-3xl font-bold ${a.value}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>

        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${a.icon} text-white`}>
            <Icon className="text-base" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}