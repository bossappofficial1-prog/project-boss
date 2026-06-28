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
    icon: typeof CheckCircle;
    label: string;
  }
> = {
  AWAITING_PAYMENT: {
    color: "#f59e0b",
    icon: Hourglass,
    label: "Menunggu Pembayaran",
  },
  AWAITING_VERIFICATION: {
    color: "#f59e0b",
    icon: Hourglass,
    label: "Menunggu Verifikasi",
  },
  PROCESSING: {
    color: "#3b82f6",
    icon: Clock,
    label: "Diproses",
  },
  CONFIRMED: {
    color: "#06b6d4",
    icon: CheckCircle,
    label: "Dikonfirmasi",
  },
  READY: {
    color: "#06b6d4",
    icon: CheckCircle,
    label: "Siap",
  },
  ON_GOING: {
    color: "#f97316",
    icon: Play,
    label: "Sedang Berlangsung",
  },
  COMPLETED: {
    color: "#22c55e",
    icon: CheckCircle,
    label: "Selesai",
  },
  CANCELLED: {
    color: "#ef4444",
    icon: XCircle,
    label: "Dibatalkan",
  },
};
