import { MenuItem } from "./menu-item";

export const MENU_ITEM_COUNT = 8;

export const MenuItems = () => {
    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8"
        >
            {Array.from({ length: MENU_ITEM_COUNT }).map((_, index) => (
                <MenuItem key={index} index={index} />
            ))}
        </div>
    );
};