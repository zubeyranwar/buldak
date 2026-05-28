import configPromise from "@payload-config";
import { getPayload } from "payload";
import { Catagories } from "./catagories";
import { MenuItems } from "./menu-items";
import type { MenuCard, MenuCategory } from "./menu-types";
import { MenuClient } from "./menu-client";

type CatagoryDoc = {
    id: string
    name: string
}

type MenuDoc = {
    id: string
    title: string
    description: string
    price: number
    oldPrice?: number | null
    label: string
    catagory: string | CatagoryDoc
    image: string | { url?: string | null }
    slug: string
}

export const Menu = async () => {
    const payload = await getPayload({
        config: configPromise,
    });

    const [catagoriesResult, menuResult] = await Promise.all([
        payload.find({
            collection: "catagory" as never,
            limit: 100,
            sort: "name",
        }),
        payload.find({
            collection: "menu" as never,
            limit: 100,
            depth: 1,
            sort: "-date",
        }),
    ]);

    const menuDocs = menuResult.docs as MenuDoc[];
    const catagoryDocs = catagoriesResult.docs as CatagoryDoc[];

    const items: MenuCard[] = menuDocs.map((doc) => {
        const catagory = typeof doc.catagory === "object" && doc.catagory ? doc.catagory : null;
        const image = typeof doc.image === "object" && doc.image ? doc.image : null;

        return {
            id: doc.id,
            title: doc.title,
            description: doc.description,
            categoryName: catagory?.name ?? "Uncategorized",
            price: doc.price,
            oldPrice: doc.oldPrice,
            label: doc.label,
            imageUrl: image?.url ?? null,
            slug: doc.slug,
        };
    });

    const counts = items.reduce<Record<string, number>>((accumulator, item) => {
        const key = item.categoryName;
        accumulator[key] = (accumulator[key] ?? 0) + 1;

        return accumulator;
    }, {});

    const catagories: MenuCategory[] = [
        {
            id: "all",
            name: "All",
            count: items.length,
        },
        ...catagoryDocs.map((doc) => ({
            id: doc.id,
            name: doc.name,
            count: counts[doc.name] ?? 0,
        })),
    ];

    return (
        <MenuClient items={items} catagories={catagories} />
    );
}

