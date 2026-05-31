import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ReserveTableErrorPage() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-20">
            <h1 className="text-heading-2! md:text-heading-1!">Something went wrong</h1>
            <p className="text-muted-foreground text-center max-w-sm">
                We couldn't complete your reservation. Please try again.
            </p>
            <Link href="/reserve-table">
                <Button>
                    Try again
                </Button>
            </Link>
        </div>
    )
}