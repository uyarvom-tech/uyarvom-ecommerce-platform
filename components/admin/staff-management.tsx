'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Users, 
  Shield, 
  UserCheck,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"

interface StaffMember {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: string
  permissions: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

interface StaffManagementProps {
  staff: StaffMember[]
}

interface NewStaffForm {
  email: string
  fullName: string
  role: string
  password: string
}

export function StaffManagement({ staff: initialStaff }: StaffManagementProps) {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string} | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [newStaffForm, setNewStaffForm] = useState<NewStaffForm>({
    email: '',
    fullName: '',
    role: 'staff',
    password: ''
  })

  // Calculate statistics
  const totalStaff = staff.length
  const activeStaff = staff.filter(s => s.isActive).length
  const adminStaff = staff.filter(s => s.role === 'admin').length
  const regularStaff = staff.filter(s => s.role === 'staff').length

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewStaffForm(prev => ({ ...prev, password }))
  }

  // Handle create staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create staff member')
      }

      const result = await response.json()
      
      // Store credentials to show to admin
      setCreatedCredentials({
        email: newStaffForm.email,
        password: newStaffForm.password
      })

      toast.success('Staff member created successfully!')
      
      // Reset form
      setNewStaffForm({
        email: '',
        fullName: '',
        role: 'staff',
        password: ''
      })
      setShowCreateForm(false)
      
      // Refresh data
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create staff member')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle edit staff
  const handleEditStaff = (staffMember: StaffMember) => {
    setEditingStaff(staffMember)
    setNewStaffForm({
      email: staffMember.email,
      fullName: staffMember.fullName,
      role: staffMember.role,
      password: ''
    })
    setShowEditForm(true)
  }

  // Handle update staff
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newStaffForm.fullName,
          role: newStaffForm.role,
          ...(newStaffForm.password && { password: newStaffForm.password })
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update staff member')
      }

      toast.success('Staff member updated successfully!')
      setShowEditForm(false)
      setEditingStaff(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update staff member')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete staff
  const handleDeleteStaff = (staffMember: StaffMember) => {
    setStaffToDelete(staffMember)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/staff/${staffToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete staff member')
      }

      toast.success('Staff member deleted successfully!')
      setDeleteDialogOpen(false)
      setStaffToDelete(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete staff member')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success(`${field} copied to clipboard!`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'staff': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin'
      case 'staff': return 'Staff'
      default: return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Staff</p>
                <p className="text-2xl font-bold">{totalStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Active</p>
                <p className="text-2xl font-bold">{activeStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-purple-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Admins</p>
                <p className="text-2xl font-bold">{adminStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Staff Members</p>
                <p className="text-2xl font-bold">{regularStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Staff Members</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Create Staff Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaffForm.email}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="staff@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={newStaffForm.fullName}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={newStaffForm.role} onValueChange={(value) => setNewStaffForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="text"
                      value={newStaffForm.password}
                      onChange={(e) => setNewStaffForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Staff Member'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewStaffForm({
                      email: '',
                      fullName: '',
                      role: 'staff',
                      password: ''
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Staff Form */}
      {showEditForm && editingStaff && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="editEmail">Email Address</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={newStaffForm.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <Label htmlFor="editFullName">Full Name *</Label>
                  <Input
                    id="editFullName"
                    value={newStaffForm.fullName}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="editRole">Role *</Label>
                  <Select value={newStaffForm.role} onValueChange={(value) => setNewStaffForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="editPassword">New Password (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="editPassword"
                      type="text"
                      value={newStaffForm.password}
                      onChange={(e) => setNewStaffForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Leave empty to keep current password"
                    />
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Staff Member'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingStaff(null)
                    setNewStaffForm({
                      email: '',
                      fullName: '',
                      role: 'staff',
                      password: ''
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((staffMember) => (
          <Card key={staffMember.id} className="group hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Staff Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{staffMember.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{staffMember.email}</p>
                    <Badge className={`mt-2 ${getRoleBadgeColor(staffMember.role)}`}>
                      {getRoleDisplayName(staffMember.role)}
                    </Badge>
                  </div>
                </div>

                {/* Created Date */}
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(staffMember.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEditStaff(staffMember)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDeleteStaff(staffMember)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {staff.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No staff members yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first staff member to get started
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Credentials Display Modal */}
      {createdCredentials && (
        <AlertDialog open={!!createdCredentials} onOpenChange={() => setCreatedCredentials(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Staff Member Created!
              </AlertDialogTitle>
              <AlertDialogDescription>
                Share these login credentials with the staff member:
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Email:</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={createdCredentials.email} readOnly className="bg-muted" />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(createdCredentials.email, 'Email')}
                  >
                    {copiedField === 'Email' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Password:</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={createdCredentials.password} 
                    type={showPassword ? 'text' : 'password'}
                    readOnly 
                    className="bg-muted" 
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(createdCredentials.password, 'Password')}
                  >
                    {copiedField === 'Password' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setCreatedCredentials(null)}>
                Got it!
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{staffToDelete?.fullName}"? This action cannot be undone and will remove all their access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Staff Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
