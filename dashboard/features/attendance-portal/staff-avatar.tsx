"use client";

import type { StaffAvatarProps } from "./types";

export function StaffAvatar({ staff, size = "md" }: StaffAvatarProps) {
  const initials = staff.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : "w-11 h-11 text-sm";
  const bgClass =
    staff.role === "MANAGER"
      ? "bg-primary/15 text-primary"
      : "bg-muted text-muted-foreground";

  return (
    <div
      className={`${sizeClass} ${bgClass} rounded-full flex items-center justify-center font-semibold shrink-0 overflow-hidden`}
    >
      {staff.faceImageUrl ? (
        <img
          src={staff.faceImageUrl}
          alt={staff.name}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
