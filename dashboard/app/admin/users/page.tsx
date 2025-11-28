"use client"

import React, { useEffect, useState } from "react"
import {
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Mail,
  Key,
  UserCog,
  LogIn,
  Filter,
  Download
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserTable } from "@/components/features/admin/user/Table"
import { useUser, useUsers } from "@/hooks/useUsers"
import { useUserData } from "@/hooks/useUserData"
import useUserV2 from "@/hooks/useUserV2"

// --- TYPES ---
type UserRole = "OWNER" | "ADMIN"
type UserStatus = "verified" | "unverified" | "suspended"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  lastLogin: string
  avatar?: string
}

// --- MOCK DATA ---
const USERS: User[] = [
  {
    id: "USR-001",
    name: "Admin Boss",
    email: "admin@boss-platform.com",
    role: "OWNER",
    status: "verified",
    createdAt: "2023-01-15",
    lastLogin: "2 menit yang lalu",
    avatar: "/avatars/admin.jpg"
  },
  {
    id: "USR-002",
    name: "Sarah Connor",
    email: "sarah@skynet.net",
    role: "ADMIN",
    status: "verified",
    createdAt: "2023-03-10",
    lastLogin: "1 jam yang lalu",
    avatar: "/avatars/01.png"
  },
  {
    id: "USR-003",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "ADMIN",
    status: "unverified",
    createdAt: "2023-11-05",
    lastLogin: "3 hari yang lalu",
    avatar: "/avatars/02.png"
  },
  {
    id: "USR-004",
    name: "Jane Smith",
    email: "jane.smith@company.co",
    role: "ADMIN",
    status: "suspended",
    createdAt: "2023-08-22",
    lastLogin: "1 bulan yang lalu",
    avatar: "/avatars/03.png"
  },
  {
    id: "USR-005",
    name: "Michael Chen",
    email: "m.chen@tech.asia",
    role: "ADMIN",
    status: "verified",
    createdAt: "2023-05-14",
    lastLogin: "Kemarin",
  },
]

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL")
  const { data, isRefetching, refetch } = useUsers({
    search: searchQuery,
    limit: limit,
    page: page
  })

  const onPaginationChange = (params: { page: number, limit: number }) => {
    setPage(params.page)
    setLimit(params.limit)
  }

  return (
    <div className="flex flex-col space-y-3 p-3 h-full">

      {/* --- HEADER & ACTIONS --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground text-sm">
            Kelola akses, peran, dan status pengguna sistem.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="shadow-sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Tambah User
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">

        {/* Filters Group */}
        <div className="flex gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] bg-muted/30 border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span className="truncate text-xs font-medium">{roleFilter === 'ALL' ? 'Semua Role' : roleFilter}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Role</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <UserTable
        users={data?.data || []}
        onSearchChange={setSearchQuery}
        onRefresh={refetch}
        isRefresh={isRefetching}
        limit={limit}
        onPaginationChange={onPaginationChange}
        paginationLength={data?.pagination.total}
      />
    </div>
  )
}