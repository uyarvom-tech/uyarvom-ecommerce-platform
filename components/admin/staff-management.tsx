'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus,
  Shield,
  ShieldCheck,
  Crown,
  Search,
  Mail,
  Calendar
} from "lucide-react"
import Image from "next/image"

interface StaffMember {
  id: string
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: string[]
  created_at: string
  profiles?: {
    full_name: string
    email: string
    avatar_url?: string
  }
}

interface StaffManagementProps {
  staffMembers: StaffMember[]
  currentUser: StaffMember
}

const roleConfig = {
  super_admin: {
    label: 'Super Admin',
    icon: Crown,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Full system access'
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Manage products, orders, and users'
  },
  moderator: {
    label: 'Moderator',
    icon: Shield,
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Limited management access'
  }
}

export function StaffManagement({ staffMembers, currentUser }: StaffManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null)
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'moderator' as 'super_admin' | 'admin' | 'moderator'
  })

  // Filter staff members
  const filteredStaff = staffMembers.filter(member => {
    const matchesSearch = member.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleInviteStaff = () => {
    console.log('Inviting staff member:', inviteData)
    // TODO: Implement staff invitation
    setInviteData({ email: '', role: 'moderator' })
    setIsInviteDialogOpen(false)
  }

  const handleUpdateRole = (memberId: string, newRole: string) => {
    console.log('Updating role:', memberId, newRole)
    // TODO: Implement role update
    setEditingMember(null)
  }

  const handleDeleteMember = (memberId: string) => {
    console.log('Deleting staff member:', memberId)
    // TODO: Implement staff deletion
    setDeletingMember(null)
  }

  const canManageMember = (member: StaffMember) => {
    // Super admin can manage everyone except themselves
    if (currentUser.role === 'super_admin') {
      return member.id !== currentUser.id
    }
    // Admins can only manage moderators
    if (currentUser.role === 'admin') {
      return member.role === 'moderator'
    }
    // Moderators can't manage anyone
    return false
  }

  const getRoleIcon = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig]
    const Icon = config?.icon || Shield
    return <Icon className="h-4 w-4" />
  }

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig]
    return (
      <Badge variant="outline" className={config?.color}>
        {getRoleIcon(role)}
        <span className="ml-1">{config?.label}</span>
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage admin users and their permissions</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={inviteData.role} onValueChange={(value: any) => setInviteData({ ...inviteData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser.role === 'super_admin' && (
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          {getRoleIcon('admin')}
                          <span>Admin</span>
                        </div>
                      </SelectItem>
                    )}
                    <SelectItem value="moderator">
                      <div className="flex items-center gap-2">
                        {getRoleIcon('moderator')}
                        <span>Moderator</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteStaff}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <div className="space-y-4">
        {filteredStaff.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  <Image
                    src={member.profiles?.avatar_url || `/placeholder.svg?height=48&width=48&query=${member.profiles?.full_name}`}
                    alt={member.profiles?.full_name || 'Staff member'}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Member Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{member.profiles?.full_name || 'Unknown User'}</h3>
                    {member.id === currentUser.id && (
                      <Badge variant="secondary">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Mail className="h-3 w-3" />
                    <span>{member.profiles?.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {getRoleBadge(member.role)}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canManageMember(member) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingMember(member)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeletingMember(member)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredStaff.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No staff members found</h3>
              <p className="text-muted-foreground">Try adjusting your search or invite new staff members</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Change role for {editingMember?.profiles?.full_name}
              </p>
              <Select 
                defaultValue={editingMember?.role} 
                onValueChange={(value) => editingMember && handleUpdateRole(editingMember.id, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentUser.role === 'super_admin' && (
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        {getRoleIcon('admin')}
                        <div>
                          <div>Admin</div>
                          <div className="text-xs text-muted-foreground">Manage products, orders, and users</div>
                        </div>
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      {getRoleIcon('moderator')}
                      <div>
                        <div>Moderator</div>
                        <div className="text-xs text-muted-foreground">Limited management access</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access for {deletingMember?.profiles?.full_name}? 
              This action cannot be undone and they will lose all admin privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingMember && handleDeleteMember(deletingMember.id)}
            >
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}