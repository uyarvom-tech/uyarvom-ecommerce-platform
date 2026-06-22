'use client'

import { useState } from 'react'
import { updateSystemSetting } from '@/lib/actions/merchandising'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'

interface SettingFormProps {
    label: string
    name: string
    defaultValue: string
    description: string
    icon: React.ReactNode
}

export function SettingForm({ label, name, defaultValue, description, icon }: SettingFormProps) {
    const [value, setValue] = useState(defaultValue)
    const [isPending, setIsPending] = useState(false)

    const handleSave = async () => {
        setIsPending(true)
        const res = await updateSystemSetting(name, value)
        setIsPending(false)
        if (res.success) toast.success(`${label} updated successfully`)
        else toast.error(res.error)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black">
                    {icon} {label}
                </Label>
                {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex gap-3">
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="rounded-none border-muted h-10 text-xs font-bold focus-visible:ring-black shadow-sm"
                />
                <Button
                    onClick={handleSave}
                    disabled={isPending || value === defaultValue}
                    className="bg-black text-white hover:bg-black/90 rounded-none h-10 px-4 transition-all"
                >
                    <Save className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-relaxed font-bold opacity-70 italic">
                {description}
            </p>
        </div>
    )
}
