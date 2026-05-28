"use client";

import { useState } from "react";
import { Catagories } from "./catagories";
import { MenuItems } from "./menu-items";
import type { MenuCard, MenuCategory } from "./menu-types";

export const MenuClient = ({ items, catagories }: { items: MenuCard[], catagories: MenuCategory[] }) => {
    const [selected, setSelected] = useState("all");

    const filtered = selected === "all"
        ? items
        : items.filter(item => item.categoryName === catagories.find(c => c.id === selected)?.name);

    return (
        <section id="menu" className="flex flex-col md:flex-row gap-2.5 mt-20">
            <Catagories
                catagories={catagories}
                selected={selected}
                onSelect={setSelected}
            />
            <MenuItems items={filtered} />
        </section>
    );
};