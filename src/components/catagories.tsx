"use client";

import { motion } from "motion/react";
import type { MenuCategory } from "./menu-types";

export const Catagories = ({
    catagories,
    selected,
    onSelect,
}: {
    catagories: MenuCategory[];
    selected: string;
    onSelect: (id: string) => void;
}) => {
    return (
        <div className="pb-2 md:w-[20%] flex md:flex-col items-center md:items-start justify-center md:justify-start gap-4">
            {catagories.map(category => (
                <Catagory
                    key={category.id}
                    category={category.name}
                    count={category.count}
                    active={selected === category.id}
                    onClick={() => onSelect(category.id)}
                />
            ))}
        </div>
    );
};

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
        },
    },
} as const;

const Catagory = ({
    category,
    count,
    active,
    onClick,
}: {
    category: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) => {
    return (
        <motion.p
            variants={catagoryVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            onClick={onClick}
            className={`w-fit! nav-link cursor-pointer whitespace-nowrap hover:text-gray! transition-colors
                ${!active ? "text-primary!" : "text-gray!"}`}
        >
            {category} <span className="-ml-1 text-[12px]">{count}</span>
        </motion.p>
    );
};