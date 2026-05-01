import { HeroHeadingText } from "./hero-heading-text";
import { LayerInViewAnim } from "./layer-in-view-anim";

export const Hero = () => {
    return (
        <section className="flex flex-col md:flex-row  justify-between mt-24">
            <div className="spacer" />
            <HeroHeadingText />
            <LayerInViewAnim className="md:w-[20%]">
                <p className="body-low">
                    Spicy chicken & Korean foods — served daily from 8 AM to 8 PM behind skylight hotel, Addis Ababa
                </p>
            </LayerInViewAnim>
        </section>
    );
};