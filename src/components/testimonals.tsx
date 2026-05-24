import configPromise from "@payload-config";
import { getPayload } from "payload";

import { Container } from "./container";
import { TestimonalSwiper } from "./testimonal-card";
import { LayerInViewAnim } from "./layer-in-view-anim";

export type TestimonalDoc = {
    id: string;
    quote: string;
    coverImage: {
        url: string;
    };
    videoUrl: string;
}

export const Testimonals = async () => {
    const payload = await getPayload({
        config: configPromise,
    });

    const testimonalsDocs = await payload.find({
        collection: "testimonal" as never,
        limit: 100,
        depth: 1,
        sort: "-createdAt",
    });

    const testimonals = testimonalsDocs.docs as TestimonalDoc[];

    return (
        <section className="mt-32 flex flex-col gap-12 overflow-hidden">
            <Container>
                <div className="flex items-end justify-between gap-6">
                    <div className="max-w-2xl space-y-3">
                        <LayerInViewAnim>
                            <>
                                <h2 className="font-sans!">Words of affirmation</h2>
                                <p className="body-low max-w-xl!">
                                    Real reactions from guests who stopped by for ramen, drinks, and everything spicy in between.
                                </p>
                            </>
                        </LayerInViewAnim>
                    </div>
                </div>
            </Container>
            <TestimonalSwiper testimonals={Array.from({ length: 10 }, () => testimonals).flat()} />
        </section>
    )
}