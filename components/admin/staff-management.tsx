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
  CheckCircle,
  Clock,
  ChevronRight,
  UserPlus
} from "lucide-react"
import { toast } from "sonner"

interface StaffMember {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: string
  createdAt: string
  lastLogin: string
  isActive: boolean
}

interface StaffManagementProps {
  staff: StaffMember[]
  currentUserRole: string
}

export function StaffManagement({ staff: initialStaff, currentUserRole }: StaffManagementProps) {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [newStaffForm, setNewStaffForm] = useState({
    email: '',
    fullName: '',
    role: 'staff',
    password: ''
  })

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
    let pwd = ''
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewStaffForm(prev => ({ ...prev, password: pwd }))
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffForm)
      })
      if (!response.ok) throw new Error('Failed to create operator')
      setCreatedCredentials({ email: newStaffForm.email, password: newStaffForm.password })
      setShowCreateForm(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`${field} copied to system clipboard`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="space-y-12">
      {/* Operative Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Personnel Registry</h1>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-[.3em]">Authorized operators and system administrators</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-black text-white hover:bg-black/90 rounded-none h-12 px-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" /> Provision New Operator
        </Button>
      </div>

      {/* Grid Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {initialStaff.map((member) => (
          <Card key={member.id} className="rounded-none border-none shadow-sm group hover:shadow-xl transition-all">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="h-14 w-14 bg-black text-white flex items-center justify-center text-xl font-black italic">
                  {member.fullName.charAt(0)}
                </div>
                <Badge variant="outline" className={`rounded-none px-3 py-1 text-[9px] font-black uppercase tracking-widest ${member.role === 'super_admin' ? 'bg-primary text-black border-black/10' : 'bg-black text-white'}`}>
                  {member.role.replace('_', ' ')}
                </Badge>
              </div>

              <h3 className="text-xl font-black uppercase tracking-tight mb-1">{member.fullName}</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-8">{member.email}</p>

              <div className="space-y-4 pt-6 border-t border-black/5">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Enlisted</span>
                  <span className="text-black">{new Date(member.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> Activity</span>
                  <span className="text-black">{new Date(member.lastLogin).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-8 flex gap-2">
                <button className="flex-1 h-10 border border-black text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                  Profile
                </button>
                <button className="h-10 w-10 border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all">
                  <Edit className="h-4 w-4" />
                </button>
                {member.role !== 'super_admin' && (
                  <button className="h-10 w-10 border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Access Provisioning Form */}
      <AlertDialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <AlertDialogContent className="rounded-none border-4 border-black max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tighter text-4xl italic">Provision Access</AlertDialogTitle>
            <AlertDialogDescription className="text-[10px] font-black uppercase tracking-[.2em] mb-8 pb-4 border-b border-black/5">
              Establishing new operator credentials in system core
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleCreateStaff} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest">Full Legal Name</Label>
                <Input
                  required
                  className="rounded-none border-black/20 h-12 text-xs"
                  value={newStaffForm.fullName}
                  onChange={e => setNewStaffForm(p => ({ ...p, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest">Electronic Mail</Label>
                <Input
                  required
                  type="email"
                  className="rounded-none border-black/20 h-12 text-xs"
                  value={newStaffForm.email}
                  onChange={e => setNewStaffForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest">Security Clearance</Label>
                <Select value={newStaffForm.role} onValueChange={v => setNewStaffForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="rounded-none border-black/20 h-12 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-black text-xs font-bold uppercase">
                    <SelectItem value="staff">Standard Operator</SelectItem>
                    <SelectItem value="admin">Branch Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest">Master Key</Label>
                <div className="flex gap-2">
                  <Input
                    required
                    className="rounded-none border-black/20 h-12 text-xs font-mono"
                    value={newStaffForm.password}
                    onChange={e => setNewStaffForm(p => ({ ...p, password: e.target.value }))}
                  />
                  <Button type="button" variant="outline" className="rounded-none border-black h-12 px-4 shadow-sm" onClick={generatePassword}>
                    <Shield className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <AlertDialogFooter className="pt-8 border-t border-black/5">
              <AlertDialogCancel className="rounded-none h-12 px-8 text-[10px] font-black uppercase tracking-widest">Abort</AlertDialogCancel>
              <Button type="submit" disabled={isLoading} className="bg-black text-white hover:bg-black/90 rounded-none h-12 px-10 text-[10px] font-black uppercase tracking-widest">
                {isLoading ? 'Processing...' : 'Authorize Operator'}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credentials Output */}
      {createdCredentials && (
        <AlertDialog open={!!createdCredentials} onOpenChange={() => setCreatedCredentials(null)}>
          <AlertDialogContent className="rounded-none border-8 border-primary max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-black uppercase tracking-tighter text-4xl italic flex items-center gap-4">
                <CheckCircle className="h-10 w-10 text-black" /> Authorization Successful
              </AlertDialogTitle>
              <AlertDialogDescription className="py-6 border-y border-black/5 my-6 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                Credentials established. These values are only visible once. Transfer to operator immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-6">
              <div className="p-6 bg-muted">
                <p className="text-[8px] font-black uppercase tracking-[.3em] text-muted-foreground mb-3">Login Identity</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold">{createdCredentials.email}</span>
                  <button onClick={() => copyToClipboard(createdCredentials.email, 'Email')} className="hover:text-primary transition-colors"><Copy className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="p-6 bg-black text-white">
                <p className="text-[8px] font-black uppercase tracking-[.3em] text-gray-500 mb-3">Security Key</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-black italic">{showPassword ? createdCredentials.password : '••••••••••••••••'}</span>
                  <div className="flex gap-4">
                    <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                    <button onClick={() => copyToClipboard(createdCredentials.password, 'Password')}><Copy className="h-5 w-5" /></button>
                  </div>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="mt-10">
              <AlertDialogAction onClick={() => setCreatedCredentials(null)} className="w-full bg-black text-white hover:bg-black/90 rounded-none h-14 text-[10px] font-black uppercase tracking-[.3em]">
                Seal Credentials
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
