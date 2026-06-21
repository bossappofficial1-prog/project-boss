import { LucideIcon, Package, Ticket, ToolCase } from "lucide-react-native";
import { Linking, type ViewStyle } from "react-native";
import { OutletProduct } from "../features/outlet";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cnStyle(...inputs: ClassValue[]): ViewStyle {
  return twMerge(clsx(inputs)) as ViewStyle;
}

export function formatTime(time: string): string {
  const date = new Date(time);

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const mapProduct: Record<
  OutletProduct["type"],
  {
    icon: LucideIcon;
    label: string;
    color: string;
  }
> = {
  GOODS: {
    icon: Package,
    color: "22c55e",
    // icon: <Package size={16} color="#22c55e" />,
    label: "Barang",
  },
  SERVICE: {
    icon: ToolCase,
    color: "8b5cf6",
    // icon: <ToolCase size={16} color="#8b5cf6" />,
    label: "Jasa",
  },
  TICKET: {
    icon: Ticket,
    color: "f59e0b",
    // icon: <Ticket size={16} color="#f59e0b" />,
    label: "Tiket",
  },
};

export const formatPhoneNumber = (phone: string) => {
  let number = phone.replace(/\D/g, "");

  if (number.startsWith("08")) {
    number = `62${number.slice(1)}`;
  } else if (number.startsWith("620")) {
    number = `62${number.slice(3)}`;
  }

  return number;
};

const getInstagramUsername = (value: string) => {
  return value
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
};

export const openWhatsApp = async (phone: string) => {
  const formattedPhone = formatPhoneNumber(phone);

  await Linking.openURL(
    `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
      "Halo, saya ingin bertanya.",
    )}`,
  );
};

export const openInstagram = async (username: string) => {
  const cleanUsername = username.startsWith("https://")
    ? getInstagramUsername(username)
    : username.replace("@", "").trim();

  await Linking.openURL(`https://instagram.com/${cleanUsername}`);
};
