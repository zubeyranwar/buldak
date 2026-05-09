import configPromise from "@payload-config";
import { Container } from "@/components/container";
import { MenuItem } from "@/components/menu-item";
import type { MenuCard } from "@/components/menu-types";
import { Button } from "@/components/ui/button";
import { getPayload } from "payload";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayerInViewAnim } from "@/components/layer-in-view-anim";

type CatagoryDoc = {
    id: string;
    name: string;
};

type MenuDoc = {
    id: string;
    title: string;
    description?: string | null;
    price: number;
    oldPrice?: number | null;
    volume?: string | null;
    kcal?: number | null;
    label?: string | null;
    catagory: string | CatagoryDoc;
    image: string | { url?: string | null };
    slug: string;
};

type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};

const toMenuCard = (doc: MenuDoc): MenuCard => {
    const catagory = typeof doc.catagory === "object" && doc.catagory ? doc.catagory : null;
    const image = typeof doc.image === "object" && doc.image ? doc.image : null;

    return {
        id: doc.id,
        title: doc.title,
        description: doc.description ?? "",
        categoryName: catagory?.name ?? "Uncategorized",
        price: doc.price,
        oldPrice: doc.oldPrice,
        label: doc.label ?? "Menu",
        imageUrl: image?.url ?? null,
        slug: doc.slug,
    };
};

export default async function MenuItemDetail({ params }: PageProps) {
    const { slug } = await params;

    const payload = await getPayload({
        config: configPromise,
    });

    const menuResult = await payload.find({
        collection: "menu" as never,
        where: {
            slug: {
                equals: slug,
            },
        },
        limit: 1,
        depth: 1,
    });

    const currentDoc = (menuResult.docs[0] as MenuDoc | undefined) ?? null;

    if (!currentDoc) {
        notFound();
    }

    const catagoryId =
        typeof currentDoc.catagory === "object" && currentDoc.catagory
            ? currentDoc.catagory.id
            : currentDoc.catagory;

    const relatedResult = await payload.find({
        collection: "menu" as never,
        where: {
            and: [
                {
                    catagory: {
                        equals: catagoryId,
                    },
                },
                {
                    id: {
                        not_equals: currentDoc.id,
                    },
                },
            ],
        },
        limit: 3,
        depth: 1,
        sort: "-date",
    });

    const relatedItems = (relatedResult.docs as MenuDoc[]).map(toMenuCard);
    const currentItem = toMenuCard(currentDoc);

    const tagItems = [
        {
            id: "price",
            saleVisible: currentDoc.oldPrice != null && currentDoc.oldPrice > currentDoc.price,
            oldPrice: currentDoc.oldPrice != null ? `$${currentDoc.oldPrice.toFixed(2)}` : undefined,
            price: `$${currentDoc.price.toFixed(2)}`,
            value: undefined as string | undefined,
        },
        {
            id: "volume",
            saleVisible: false,
            value: currentDoc.volume ?? undefined,
        },
        {
            id: "kcal",
            saleVisible: false,
            value: currentDoc.kcal != null ? `${currentDoc.kcal} kcal` : undefined,
        },
        {
            id: "label",
            saleVisible: false,
            value: currentDoc.label ?? undefined,
        },
    ].filter((item) => item.saleVisible || item.value);

    const relatedPreview = relatedItems[0] ?? null;

    return (
        <Container>
            <main className="flex flex-col gap-2 pt-17.5">
                <section>
                    <div className="grid grid-cols-4">
                        <div className="spacer" />
                        <div className="flex flex-col gap-5 col-span-2">
                            <LayerInViewAnim>
                                <Button className="w-fit text-white">{currentItem.categoryName}</Button>
                            </LayerInViewAnim>
                            <div className="flex flex-col gap-7.5">
                                <LayerInViewAnim>
                                    <h1 className="font-sans! text-heading-2! md:text-heading-1">{currentItem.title}</h1>
                                </LayerInViewAnim>
                                <LayerInViewAnim>
                                    <p className="body-low">{currentItem.description}</p>
                                </LayerInViewAnim>
                            </div>
                        </div>
                        <div className="spacer" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="spacer" />
                        <div className="flex flex-col gap-7.5 col-span-2">
                            <LayerInViewAnim>
                                <div className="bg-white group-hover:bg-primary/10 flex items-center justify-center">
                                    <Image
                                        src={currentItem.imageUrl as string}
                                        alt={currentItem.title}
                                        width={500}
                                        height={500}
                                    />
                                </div>
                            </LayerInViewAnim>
                            <LayerInViewAnim>
                                <p className="body-low">{currentItem.description}</p>
                            </LayerInViewAnim>
                            {relatedPreview && (
                                <div className="flex justify-between">
                                    <div />
                                    <div className="spacer" />
                                    <Link href={relatedPreview.slug} className="flex flex-col items-end">
                                        <p className="body-low orange-link">{relatedPreview.title.toLowerCase()}</p>
                                        <Image
                                            src={relatedPreview.imageUrl as string}
                                            alt={relatedPreview.title}
                                            width={50}
                                            height={50}
                                        />
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="ml-0 md:ml-10">
                            <div className="pt-2.5 flex flex-wrap gap-2">
                                {tagItems.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-2">
                                        <Tag value={item} saleVisible={item.saleVisible} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                <section className="grid grid-cols-1 md:grid-cols-4 mt-4 md:mt-0">
                    <div className="spacer" />
                    <div className="col-span-3 flex flex-col gap-7.5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-sans!">other {currentItem.categoryName.toLowerCase()}</h2>
                            <Link href="/menu" className="nav-link text-primary! whitespace-nowrap">All menu</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-7.5">
                            {relatedItems.map((item, index) => (
                                <MenuItem key={item.id} index={index} item={item} itemCount={relatedItems.length} />
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </Container>
    );
}

const Tag = ({
    value,
    saleVisible,
}: {
    value: {
        oldPrice?: string;
        price?: string;
        value?: string;
    };
    saleVisible: boolean;
}) => {
    return (
        <p className="w-fit flex gap-2 border border-primary rounded-[5px] nav-link text-primary! px-2 py-1">
            {saleVisible && (
                <>
                    <span className="line-through">{value.oldPrice}</span>
                    <span>{value.price}</span>
                </>
            )}
            <span>{value.value}</span>
        </p>
    );
};
