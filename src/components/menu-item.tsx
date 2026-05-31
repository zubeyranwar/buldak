"use client";

import { getCloudinaryBlurUrl } from "@/lib/cloudinary";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { LayerInViewAnim } from "./layer-in-view-anim";
import type { MenuCard } from "./menu-types";

const itemVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 18 },
    show: ({ index, count }: { index: number, count: number }) => ({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 58,
            mass: 1,
            delay: index * (Math.max(count, 1) / 100),
        },
    }),
} as const;

export const MenuItem = ({ index, item, itemCount }: { index: number, item: MenuCard, itemCount: number }) => {
    if (!item) return null;

    const imageSrc = item.imageUrl || "/menu/ramen.png";
    const blurUrl = getCloudinaryBlurUrl(imageSrc);
    const formattedPrice = `${item.price} Birr`;
    const hasOldPrice = item.oldPrice != null && item.oldPrice > item.price;
    const formattedOldPrice = hasOldPrice ? `$${item.oldPrice?.toFixed(2)}` : null;

    return (
        <Link href={`/menu/${item.slug}`}>
            <motion.div
                variants={itemVariants as any}
                custom={{ index, count: itemCount }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
            >
                <motion.div
                    initial="rest"
                    whileHover="hover"
                    animate="rest"
                    className="relative group flex flex-col gap-1 cursor-pointer"
                >
                    <div className="relative w-full aspect-square bg-[#EEE9E3] group-hover:bg-primary/10 overflow-hidden">
                        <Image
                            src={imageSrc}
                            alt={item.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-contain p-6"
                            placeholder="blur"
                            blurDataURL={blurUrl}
                        />
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                        <LayerInViewAnim as="p" based="physics" delay={0.1} amount={0.1} className="nav-s text-gray!">
                            {item.categoryName}
                        </LayerInViewAnim>

                        <LayerInViewAnim as="p" based="physics" delay={0} amount={0.1} className="nav-link text-primary!">
                            {item.title}
                        </LayerInViewAnim>

                        <LayerInViewAnim as="p" based="physics" delay={0.1} amount={0.1} className="nav-s text-gray!">
                            {item.description}
                        </LayerInViewAnim>

                        <LayerInViewAnim as="p" based="physics" delay={0.2} amount={0.1} className="nav-s text-gray!">
                            {hasOldPrice ? (
                                <span className="nav-s-decor">{formattedOldPrice}</span>
                            ) : (
                                <span>{formattedPrice}</span>
                            )}
                        </LayerInViewAnim>
                    </div>

                    <span className="absolute top-2 left-2 border border-primary rounded-sm nav-s text-primary! px-2 py-1">
                        {item.label}
                    </span>
                </motion.div>
            </motion.div>
        </Link>
    );
};