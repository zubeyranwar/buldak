import { Container } from "@/components/container";
import { SubmitButton } from "@/components/submit-button";
import { handleReserveTable } from "./action";
import { ReserveTableForm } from "./_component/reserve-table-form";

export default function ReserveTable() {
    return (
        <main>
            <Container>
                <section className="pt-17.5 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="spacer" />

                        <div className="flex flex-col gap-5 col-span-2">
                            <div className="flex flex-col gap-4">
                                <h1 className="font-sans! text-heading-2! md:text-heading-1!">
                                    Reserve Table
                                </h1>

                                <p className="body-low">
                                    Please fill out the form below to reserve a table.
                                </p>
                            </div>
                        </div>

                        <div className="spacer" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="spacer" />

                        <form
                            //@ts-ignore
                            action={handleReserveTable}
                            className="col-span-2 flex flex-col gap-4"
                        >
                            <ReserveTableForm />

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
    );
}