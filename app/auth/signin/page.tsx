import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Admin Access Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p>You need admin privileges to access this area.</p>
            <p className="text-sm mt-2">
              This is a demo - admin access is automatically granted for development.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin">
                Continue to Admin Panel
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            <p>In production, this would require proper authentication.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
