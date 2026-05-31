import { cn } from "@/lib/utils";
import { MenuItem } from "./menu-item";
import type { MenuCard } from "./menu-types";

export const MenuItems = ({ items, className }: { items: MenuCard[], className?: string }) => {
    return (
        <div className={cn("w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8", className ?? "")}
        >
            {items.map((item, index) => (
                <MenuItem key={item.id} index={index} item={item} itemCount={items.length} />
            ))}
        </div>
    );
};