"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { MENU_ITEM_COUNT } from "./menu-items";

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
    show: (i: number) => ({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 58,
            mass: 1,
            delay: i * (MENU_ITEM_COUNT / 100),
        },
    }),
} as const;

export const MenuItem = ({ index }: { index: number }) => {
    return (
        <motion.div
            variants={itemVariants as any}
            custom={index}
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
                    className="bg-[#EEE9E3] group-hover:bg-primary/10"
                >
                    <Image
                        src="/menu/ramen.png"
                        alt="Ramen"
                        width={300}
                        height={200}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <motion.p variants={textVariants} transition={springTransition} className="nav-s">Catagory</motion.p>
                    <p className="nav-link text-primary!">Name</p>
                    <motion.p variants={textBlackVariants} transition={springTransition} className="nav-s">A crisp green juice packed with vitamins and minerals. </motion.p>
                    <motion.p variants={textVariants} transition={springTransition} className="nav-s">
                        <motion.span variants={textVariants} transition={springTransition} className="nav-s-decor">Price</motion.span> <span>Price</span>
                    </motion.p>
                </div>
                <span className="absolute top-2 left-2 border border-primary rounded-sm nav-s text-primary! px-2 py-1">Buldak</span>
            </motion.div>
        </motion.div>
    )
}