import { getMenuData } from "@/lib/use-menu-data";
import { MenuClient } from "./menu-client";

export const Menu = async () => {
    const { items, catagories } = await getMenuData();
    return <MenuClient items={items} catagories={catagories} />;
};