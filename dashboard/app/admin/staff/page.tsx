"use client"

import React from "react"
import {
    Users,
    Phone,
    MoreHorizontal,
    Search,
    Filter,
    Lock,
    Ban,
    Mail,
    UserCog,
    Plus
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SelectOption } from "@/components/shared/SelectOption"

// --- TYPES ---
type StaffRole = "MANAGER" | "CASHIER" | "BARISTA" | "KITCHEN"
type StaffStatus = "ACTIVE" | "DISABLED"

interface Staff {
    id: string
    name: string
    role: StaffRole
    status: StaffStatus
    email: string
    phone: string
    assignedOutlets: string[]
    avatar?: string
}

// --- MOCK DATA ---
const STAFF: Staff[] = [
    {
        id: "STF-001",
        name: "Andi Wijaya",
        role: "MANAGER",
        status: "ACTIVE",
        email: "andi@kopisenja.com",
        phone: "08123456789",
        assignedOutlets: ["Kopi Senja - Senopati", "Kopi Senja - Tebet"],
        avatar: "/avatars/04.png"
    },
    {
        id: "STF-002",
        name: "Dewi Sartika",
        role: "CASHIER",
        status: "ACTIVE",
        email: "dewi@kopisenja.com",
        phone: "08198765432",
        assignedOutlets: ["Kopi Senja - Senopati"],
        avatar: "/avatars/05.png"
    },
    {
        id: "STF-003",
        name: "Bambang Pamungkas",
        role: "BARISTA",
        status: "DISABLED",
        email: "bambang@martabaksultan.id",
        phone: "08134567890",
        assignedOutlets: ["Martabak Sultan - Dago"],
        avatar: "/avatars/06.png"
    }
]

export default function StaffManagement() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [roleFilter, setRoleFilter] = React.useState<string>("ALL")

    const filteredStaff = STAFF.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === "ALL" || item.role === roleFilter
        return matchesSearch && matchesRole
    })

    return (
        <div className="flex flex-col space-y-3 p-3 h-full">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manajemen Staff</h2>
                    <p className="text-muted-foreground text-sm">
                        Kelola akun staff, penugasan outlet, dan akses sistem.
                    </p>
                </div>
                <Button size="sm" className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Staff
                </Button>
            </div>

            {/* FILTERS */}
            <Card className="rounded-md shadow-md border-border/50 bg-card">
                <CardContent className="p-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama, email atau ID staff..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/30 border-border/50"
                            />
                        </div>
                        <SelectOption
                            className="w-[180px] bg-muted/30 border-border/50"
                            onValueChange={setRoleFilter}
                            options={[
                                { value: `ALL`, label: `Semua Role` },
                                { value: `CASHIER`, label: `Cashier` },
                                { value: `BARISTA`, label: `Barista` },
                                { value: `KITCHEN`, label: `Kitchen` }
                            ]}
                            value={roleFilter}
                            placeholder={
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Filter className="h-3.5 w-3.5" />
                                    <span className="truncate text-xs font-medium">
                                        {roleFilter === 'ALL' ? 'Semua Role' : roleFilter}
                                    </span>
                                </div>
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* TABLE */}
            <Card className="rounded-md shadow-md border-border/50 overflow-hidden flex-1">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Nama Staff</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Kontak</TableHead>
                            <TableHead>Outlet Penugasan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStaff.map((staff) => (
                            <TableRow key={staff.id} className="hover:bg-muted/30">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={staff.avatar} />
                                            <AvatarFallback>{staff.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{staff.name}</span>
                                            <span className="text-xs text-muted-foreground">{staff.id}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="text-[10px]">
                                        {staff.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {staff.phone}</span>
                                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {staff.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {staff.assignedOutlets.map((outlet, idx) => (
                                            <Badge key={idx} variant="outline" className="text-[10px] bg-background">
                                                {outlet}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${staff.status === 'ACTIVE' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                        <div className={`h-2 w-2 rounded-full ${staff.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                        {staff.status}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <UserCog className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Detail
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Reset Password
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">
                                                <Ban className="mr-2 h-4 w-4" /> Disable Akun
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}