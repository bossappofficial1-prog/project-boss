"use client"

import React from "react"
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

// --- TYPES ---
type UserRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER"
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
    role: "EDITOR",
    status: "unverified",
    createdAt: "2023-11-05",
    lastLogin: "3 hari yang lalu",
    avatar: "/avatars/02.png"
  },
  {
    id: "USR-004",
    name: "Jane Smith",
    email: "jane.smith@company.co",
    role: "VIEWER",
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
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  // --- FILTER LOGIC ---
  const filteredUsers = USERS.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

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

      {/* --- FILTERS & SEARCH --- */}
      <Card className="rounded-md shadow-md border-border/50 bg-card">
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/30 border-border/50 focus-visible:bg-background transition-colors"
              />
            </div>

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
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-muted/30 border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="truncate text-xs font-medium">
                        {statusFilter === 'ALL' ? 'Semua Status' : 
                         statusFilter === 'verified' ? 'Terverifikasi' : 
                         statusFilter === 'unverified' ? 'Belum Verif' : 'Ditangguhkan'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="verified">Terverifikasi</SelectItem>
                  <SelectItem value="unverified">Belum Verif</SelectItem>
                  <SelectItem value="suspended">Ditangguhkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- USERS TABLE --- */}
      <Card className="rounded-md shadow-md border-border/50 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px]">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Terdaftar</TableHead>
                <TableHead className="hidden md:table-cell">Login Terakhir</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Tidak ada user yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border/50">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="text-xs font-medium">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`
                          text-[10px] px-2 py-0.5 h-5 font-medium border-0
                          ${user.role === 'OWNER' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400' : ''}
                          ${user.role === 'ADMIN' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' : ''}
                          ${user.role === 'EDITOR' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400' : ''}
                          ${user.role === 'VIEWER' ? 'bg-slate-500/15 text-slate-700 dark:text-slate-400' : ''}
                        `}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.status === 'verified' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {user.status === 'unverified' && <ShieldAlert className="h-4 w-4 text-amber-500" />}
                        {user.status === 'suspended' && <XCircle className="h-4 w-4 text-destructive" />}
                        <span className="text-xs capitalize text-muted-foreground">
                          {user.status === 'verified' ? 'Verified' : user.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {user.createdAt}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {user.lastLogin}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer">
                            <UserCog className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Key className="mr-2 h-4 w-4 text-muted-foreground" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-blue-600 dark:text-blue-400 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-900/20">
                            <LogIn className="mr-2 h-4 w-4" /> Impersonate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Shield className="mr-2 h-4 w-4 text-muted-foreground" /> Ubah Role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={user.role}>
                                    <DropdownMenuRadioItem value="ADMIN">Admin</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="EDITOR">Editor</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="VIEWER">Viewer</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                            Hapus User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Footer (Opsional untuk estetika) */}
        <CardFooter className="flex items-center justify-between border-t border-border/50 px-6 py-3 bg-muted/20">
            <div className="text-xs text-muted-foreground">
                Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{USERS.length}</strong> user
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Sebelumnya</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Selanjutnya</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  )
}