import { HeroHeadingText } from "./hero-heading-text";
import { LayerInViewAnim } from "./layer-in-view-anim";

export const Hero = () => {
    return (
        <section className="grid grid-cols-1 md:grid-cols-4 mt-24">
            <div className="spacer" />
            <div className="md:col-span-2">
                <HeroHeadingText />
            </div>
            <LayerInViewAnim based="time">
                <p className="body-low">
                    Spicy chicken & Korean foods — served daily from 8 AM to 8 PM behind skylight hotel, Addis Ababa
                </p>
            </LayerInViewAnim>
        </section>
    );
};