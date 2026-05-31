import { MenuCard, MenuCategory } from "@/components/menu-types";
import configPromise from "@payload-config";
import { getPayload } from "payload";

type CategoryDoc = {
    id: string;
    name: string;
};

type MenuDoc = {
    id: string;
    title: string;
    description: string;
    price: number;
    oldPrice?: number | null;
    label: string;
    catagory: string | CategoryDoc;
    image: string | { url?: string | null };
    slug: string;
};

export async function getMenuData(): Promise<{
    items: MenuCard[];
    catagories: MenuCategory[];
}> {
    const payload = await getPayload({ config: configPromise });

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
    const catagoryDocs = catagoriesResult.docs as CategoryDoc[];

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

    const counts = items.reduce<Record<string, number>>((acc, item) => {
        acc[item.categoryName] = (acc[item.categoryName] ?? 0) + 1;
        return acc;
    }, {});

    const catagories: MenuCategory[] = [
        { id: "all", name: "All", count: items.length },
        ...catagoryDocs.map((doc) => ({
            id: doc.id,
            name: doc.name,
            count: counts[doc.name] ?? 0,
        })),
    ];

    return { items, catagories };
}