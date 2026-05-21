import { z } from "zod";
import { StaffPrivilegeType } from "@prisma/client";

export const staffPrivilegeTypeEnum = z.nativeEnum(StaffPrivilegeType);

export const assignPrivilegesSchema = z.object({
  privileges: z
    .array(staffPrivilegeTypeEnum)
    .min(1, "Minimal satu privilege harus dipilih"),
});

export const removePrivilegeSchema = z.object({
  type: staffPrivilegeTypeEnum,
});

export type AssignPrivilegesValues = z.infer<typeof assignPrivilegesSchema>;
export type RemovePrivilegeValues = z.infer<typeof removePrivilegeSchema>;
