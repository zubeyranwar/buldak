"use client";

import { motion } from "motion/react";
import Image from "next/image";
import type { MenuCard } from "./menu-types";
import Link from "next/link";

const springTransition = {
    type: "spring",
    duration: 0.4,
    bounce: 0.2,
    delay: 0,
} as const;

const textVariants = {
    rest: { color: "var(--gray)" },
    hover: { color: "var(--primary)" },
};

const textBlackVariants = {
    rest: { color: "var(--black)" },
    hover: { color: "var(--primary)" },
};

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

    console.log({ item })
    const imageSrc = item.imageUrl || "/menu/ramen.png";
    const formattedPrice = `$${item.price.toFixed(2)}`;
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
                    className="relative group flex flex-col gap-1 cursor-pointer">
                    <div
                        className="bg-[#EEE9E3] group-hover:bg-primary/10 flex items-center justify-center"
                    >
                        <Image
                            src={imageSrc}
                            alt={item.title}
                            width={300}
                            height={200}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <motion.p variants={textVariants} transition={springTransition} className="nav-s">{item.categoryName}</motion.p>
                        <p className="nav-link text-primary!">{item.title}</p>
                        <motion.p variants={textBlackVariants} transition={springTransition} className="nav-s">{item.description}</motion.p>
                        <motion.p variants={textVariants} transition={springTransition} className="nav-s">
                            {hasOldPrice && (
                                <motion.span variants={textVariants} transition={springTransition} className="nav-s-decor">{formattedOldPrice}</motion.span>
                            )} <span>{formattedPrice}</span>
                        </motion.p>
                    </div>
                    <span className="absolute top-2 left-2 border border-primary rounded-sm nav-s text-primary! px-2 py-1">{item.label}</span>
                </motion.div>
            </motion.div>
        </Link>
    )
}