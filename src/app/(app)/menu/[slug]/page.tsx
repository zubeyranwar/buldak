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
import { getCloudinaryBlurUrl } from "@/lib/cloudinary";

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
    const blurUrl = getCloudinaryBlurUrl(currentItem.imageUrl as string);
    const prevItem = relatedItems[0] ?? null;
    const nextItem = relatedItems[1] ?? null;

    console.log({ currentDoc })
    const tagItems = [
        {
            id: "price",
            saleVisible: currentDoc.oldPrice != null && currentDoc.oldPrice > currentDoc.price,
            oldPrice: currentDoc.oldPrice != null ? `${currentDoc.oldPrice.toFixed(2)} Birr` : undefined,
            price: `${currentDoc.price.toFixed(2)} Birr`,
            value: `${currentDoc.price.toFixed(2)} Birr`,
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
    ].filter((item) => item.value);
    console.log({ tagItems })

    return (
        <Container>
            <main className="flex flex-col gap-20 pt-17.5">
                <section>
                    <div className="grid grid-cols-4">
                        <div className="spacer" />
                        <div className="flex flex-col gap-5 col-span-2">
                            <LayerInViewAnim amount={0.2} based="time">
                                <Button className="w-fit text-white">{currentItem.categoryName}</Button>
                            </LayerInViewAnim>
                            <div className="flex flex-col gap-6.5">
                                <LayerInViewAnim based="time" delay={0}>
                                    <h1 className="font-sans! text-heading-2! md:text-heading-1">{currentItem.title}</h1>
                                </LayerInViewAnim>
                                <LayerInViewAnim based="time" delay={0.2}>
                                    <p className="body-low">{currentItem.description}</p>
                                </LayerInViewAnim>
                            </div>
                        </div>
                        <div className="spacer" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 mt-6">
                        <div className="spacer" />
                        <div className="flex flex-col gap-7.5 col-span-2">
                            <div className="md:hidden block">
                                <div className="pt-2.5 flex flex-wrap gap-2">
                                    {tagItems.map((item, index) => (
                                        <div key={item.id} className="flex flex-col gap-2">
                                            <LayerInViewAnim delay={index * 1 / 2} based="time">
                                                <Tag value={item} saleVisible={item.saleVisible} />
                                            </LayerInViewAnim>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <LayerInViewAnim amount={0.1}>
                                <div className="relative w-full aspect-square bg-white overflow-hidden">
                                    <Image
                                        src={currentItem.imageUrl as string}
                                        alt={currentItem.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-contain"
                                        style={{ padding: "24px" }}
                                        placeholder="blur"
                                        blurDataURL={blurUrl}
                                    />
                                </div>
                            </LayerInViewAnim>
                            <LayerInViewAnim based="time" delay={0.2}>
                                <p className="body-low">{currentItem.description}</p>
                            </LayerInViewAnim>

                            <div className="flex justify-between items-end">
                                {prevItem ? (
                                    <Link href={prevItem.slug} className="flex flex-col gap-1 items-start">
                                        <p className="body-low orange-link">&lsaquo; {prevItem.title.toLowerCase()}</p>
                                        <div className="relative w-[50px] h-[50px]">
                                            <Image
                                                src={prevItem.imageUrl as string}
                                                alt={prevItem.title}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </Link>
                                ) : <div />}

                                {nextItem ? (
                                    <Link href={nextItem.slug} className="flex flex-col gap-1 items-end">
                                        <p className="body-low orange-link">{nextItem.title.toLowerCase()} ›</p>
                                        <div className="relative w-[50px] h-[50px]">
                                            <Image
                                                src={nextItem.imageUrl as string}
                                                alt={nextItem.title}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </Link>
                                ) : <div />}
                            </div>
                        </div>
                        <div className="ml-10 hidden md:block">
                            <div className="pt-2.5 flex flex-wrap gap-2">
                                {tagItems.map((item, index) => (
                                    <div key={item.id} className="flex flex-col gap-2">
                                        <LayerInViewAnim delay={index * 1 / 2} based="time">
                                            <Tag value={item} saleVisible={item.saleVisible} />
                                        </LayerInViewAnim>
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
        </Container >
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
