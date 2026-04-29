import { Catagories } from "./catagories";
import { MenuItems } from "./menu-items";

export const Menu = () => {
    return (
        <section className="flex flex-col md:flex-row gap-2.5 mt-20">
            <Catagories />
            <MenuItems />
        </section>
    )
}

