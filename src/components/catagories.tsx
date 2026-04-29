"use client";

import { motion } from "motion/react";
import type { MenuCategory } from "./menu-types";

export const Catagories = ({ catagories }: { catagories: MenuCategory[] }) => {

    return (
        <div className="w-[20%] flex md:flex-col gap-4">
            {catagories.map(category => (
                <Catagory key={category.id} category={category.name} count={category.count} />
            ))}
        </div>
    )
}


const catagoryVariants = {
    hidden: { opacity: 0, scale: 0.85, x: 0, y: 18 },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 58,
            mass: 1,
            // delay: 0.1
            // delay: i * 0.08,
        },
    },
} as const;

const Catagory = ({ category, count }: { category: string, count: number }) => {
    return (
        <motion.p
            variants={catagoryVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            key={category}
            className="nav-link text-primary! hover:text-gray! cursor-pointer">
            {category} <span className="-ml-1 text-[12px]">{count}</span>
        </motion.p>
    )
}