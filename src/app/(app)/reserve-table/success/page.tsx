import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReserveTableSuccessPage() {
    return (
        <main>
            <Container>
                <section className="pt-17.5 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="spacer" />

                        <div className="flex flex-col items-center gap-5 col-span-2 py-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <h1 className="font-sans! text-heading-2! md:text-heading-1!">
                                    Reservation Confirmed
                                </h1>
                                <p className="body-low text-muted-foreground max-w-sm">
                                    Your table has been successfully reserved. We look forward to
                                    welcoming you. Check your email for a confirmation.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                <Link href="/" className="orange-link!">
                                    <Button variant="outline">Back to Home</Button>
                                </Link>
                                <Link href="/reserve-table">
                                    <Button>Make Another Reservation</Button>
                                </Link>
                            </div>
                        </div>

                        <div className="spacer" />
                    </div>
                </section>
            </Container>
        </main>
    );
}