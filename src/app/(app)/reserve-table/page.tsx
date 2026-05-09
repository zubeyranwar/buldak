import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { handleReserveTable } from "./action";
import { SubmitButton } from "@/components/submit-button";

export type ReserveTableDoc = {
    id: string;
    name: string;
    phone: string;
    date: string;
    time: string;
    numOfGuests: number;
}

export default function ReserveTable() {
    return (
        <main>
            <Container>
                <section className="pt-17.5 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="spacer" />
                        <div className="flex flex-col gap-5 col-span-2">
                            <div className="flex flex-col gap-4">
                                <h1 className="font-sans! text-heading-2! md:text-heading-1!">Reserve Table</h1>
                                <p className="body-low">Please fill out the form below to reserve a table at our restaurant.</p>
                            </div>
                        </div>
                        <div className="spacer" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="spacer" />
                        <form action={handleReserveTable} className="col-span-2 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="name" className="body-low">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className="bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="phone" className="body-low">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    required
                                    className="bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="date" className="body-low">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    required
                                    className="bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="time" className="body-low">
                                    Time
                                </label>
                                <input
                                    type="time"
                                    id="time"
                                    name="time"
                                    required
                                    className="bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="guests" className="body-low">
                                    Number of Guests
                                </label>
                                <input
                                    type="number"
                                    id="guests"
                                    name="guests"
                                    min="1"
                                    max="10"
                                    required
                                    className="bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <SubmitButton
                                label="Reserve Table"
                                loadingText="Reserving"
                            />

                        </form>
                        <div className="spacer" />
                    </div>
                </section>
            </Container>
        </main>
    )
}