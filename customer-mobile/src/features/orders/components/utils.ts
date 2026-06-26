import { PaymentStatusType } from "@/src/types/order";
import {
  CheckCircle,
  Clock,
  Hourglass,
  Play,
  XCircle,
} from "lucide-react-native";

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatusType,
  { label: string }
> = {
  PENDING: {
    label: "Menunggu Pembayaran",
  },
  PROOF_SUBMITTED: {
    label: "Bukti Terkirim",
  },
  AWAITING_VERIFICATION: {
    label: "Menunggu diverifikasi",
  },
  SUCCESS: {
    label: "Berhasil",
  },
  FAILED: {
    label: "Gagal",
  },
  REFUNDED: {
    label: "Dana Dikembalikan",
  },
  EXPIRED: {
    label: "Kedaluwarsa",
  },
  CANCELLED: {
    label: "Dibatalkan",
  },
  REJECTED_MANUAL: {
    label: "Ditolak Manual",
  },
};

export const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bg: string;
    icon: typeof CheckCircle;
    label: string;
    accentBar: string;
  }
> = {
  AWAITING_PAYMENT: {
    color: "#d97706",
    bg: "#fef3c7",
    icon: Hourglass,
    label: "Menunggu Pembayaran",
    accentBar: "#f59e0b",
  },
  AWAITING_VERIFICATION: {
    color: "#d97706",
    bg: "#fef3c7",
    icon: Hourglass,
    label: "Menunggu Verifikasi",
    accentBar: "#f59e0b",
  },
  PROCESSING: {
    color: "#2563eb",
    bg: "#dbeafe",
    icon: Clock,
    label: "Diproses",
    accentBar: "#3b82f6",
  },
  CONFIRMED: {
    color: "#0891b2",
    bg: "#cffafe",
    icon: CheckCircle,
    label: "Dikonfirmasi",
    accentBar: "#06b6d4",
  },
  READY: {
    color: "#0891b2",
    bg: "#cffafe",
    icon: CheckCircle,
    label: "Siap",
    accentBar: "#06b6d4",
  },
  ON_GOING: {
    color: "#ea580c",
    bg: "#fff7ed",
    icon: Play,
    label: "Sedang Berlangsung",
    accentBar: "#f97316",
  },
  COMPLETED: {
    color: "#16a34a",
    bg: "#f0fdf4",
    icon: CheckCircle,
    label: "Selesai",
    accentBar: "#22c55e",
  },
  CANCELLED: {
    color: "#dc2626",
    bg: "#fef2f2",
    icon: XCircle,
    label: "Dibatalkan",
    accentBar: "#ef4444",
  },
};
