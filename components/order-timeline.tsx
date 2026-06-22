import { CheckCircle2, Circle, Clock, Package, Truck, XCircle, AlertCircle } from "lucide-react"

const eventIcons: Record<string, any> = {
    order_placed: Clock,
    payment_success: CheckCircle2,
    payment_failed: XCircle,
    confirmed: CheckCircle2,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle2,
    cancelled: XCircle,
    cancellation_requested: Clock,
    return_requested: AlertCircle,
    returned: CheckCircle2,
    refunded: CreditCard,
}

import { CreditCard } from "lucide-react"

export function OrderTimeline({ events }: { events: any[] }) {
    if (!events || events.length === 0) {
        return <p className="text-sm text-muted-foreground italic">No timeline events recorded yet.</p>
    }

    // Sort events by date descending (newest first)
    const sortedEvents = [...events].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return (
        <div className="space-y-6">
            {sortedEvents.map((event, index) => {
                const Icon = eventIcons[event.type] || Circle
                return (
                    <div key={event.id} className="relative flex gap-4">
                        {index !== sortedEvents.length - 1 && (
                            <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 bg-border" />
                        )}
                        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background ${index === 0 ? "border-primary" : "border-muted-foreground/30"
                            }`}>
                            <Icon className={`h-4 w-4 ${index === 0 ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 pt-0.5 pb-4">
                            <div className="flex justify-between items-start">
                                <p className={`font-semibold ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                                    {event.title}
                                </p>
                                <time className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                    {new Date(event.createdAt).toLocaleString("en-IN", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </time>
                            </div>
                            {event.description && (
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{event.description}</p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
