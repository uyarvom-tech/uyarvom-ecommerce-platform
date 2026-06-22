import { Truck, ShieldCheck, Clock, Mail } from "lucide-react"
import { getSystemSetting } from "@/lib/settings"

export async function TrustBlocks() {
    const shippingThreshold = await getSystemSetting("shipping_threshold", "999")
    const returnWindow = await getSystemSetting("return_window", "7")
    const supportEmail = await getSystemSetting("support_email", "support@uyarvom.com")

    const blocks = [
        {
            icon: <Truck className="h-5 w-5 text-primary" />,
            title: "Complimentary Logistics",
            description: `Complimentary artisanal shipping on all orders exceeding ₹${Number(shippingThreshold).toLocaleString("en-IN")}.`
        },
        {
            icon: <ShieldCheck className="h-5 w-5 text-primary" />,
            title: "Transactional Security",
            description: "End-to-end encrypted procurement through our verified industrial gateways."
        },
        {
            icon: <Clock className="h-5 w-5 text-primary" />,
            title: "Artifact Returns",
            description: `We offer a ${returnWindow}-day window for artifact returns and inspection.`
        },
        {
            icon: <Mail className="h-5 w-5 text-primary" />,
            title: "Expert Assistance",
            description: `Consult with our curators at ${supportEmail} for tailored advice.`
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12 border-y border-border/50">
            {blocks.map((block, index) => (
                <div key={index} className="flex gap-4">
                    <div className="mt-1 bg-primary/5 p-2 h-fit">
                        {block.icon}
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{block.title}</h4>
                        <p className="text-xs text-foreground/50 leading-relaxed font-medium">
                            {block.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
