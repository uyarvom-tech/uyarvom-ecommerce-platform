'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface DataTableSearchProps {
    placeholder?: string
    paramName?: string
}

export function DataTableSearch({
    placeholder = "Search...",
    paramName = "search"
}: DataTableSearchProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [value, setValue] = useState(searchParams.get(paramName) || '')

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set(paramName, value)
            } else {
                params.delete(paramName)
            }
            router.push(`?${params.toString()}`)
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [value, router, searchParams, paramName])

    return (
        <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-10 rounded-none bg-white border-muted h-10 text-xs shadow-sm focus-visible:ring-black"
            />
        </div>
    )
}
