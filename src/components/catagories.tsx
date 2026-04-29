"use client";

import { motion } from "motion/react";

export const Catagories = () => {
    const catagories = ["All", "Juices", "Smoothies", "Shots", "Bowls"];

    return (
        <div className="w-[20%] flex md:flex-col gap-4">
            {catagories.map(category => (
                <Catagory key={category} category={category} />
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

const Catagory = ({ category }: { category: string }) => {
    return (
        <motion.p
            variants={catagoryVariants as any}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            key={category}
            className="nav-link text-primary! hover:text-gray! cursor-pointer">
            {category} <span className="-ml-1 text-[12px]">{17}</span>
        </motion.p>
    )
}