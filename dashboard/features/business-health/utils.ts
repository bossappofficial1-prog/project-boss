import { Grade, HealthStatus } from "@/hooks/use-tools";

export const STATUS_CONFIG: Record<
  HealthStatus,
  { color: string; bg: string; label: string }
> = {
  healthy: {
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    label: "Sehat",
  },
  warning: {
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    label: "Perhatian",
  },
  danger: {
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    label: "Kritis",
  },
};

export const GRADE_CONFIG: Record<
  Grade,
  { color: string; bg: string; desc: string }
> = {
  A: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    desc: "Bisnis dalam kondisi sangat baik",
  },
  B: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    desc: "Bisnis cukup sehat, ada ruang perbaikan",
  },
  C: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    desc: "Perlu perhatian di beberapa area",
  },
  D: {
    color: "text-red-700",
    bg: "bg-red-50",
    desc: "Segera evaluasi kondisi bisnis",
  },
};
