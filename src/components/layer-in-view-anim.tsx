"use client";

import { motion, Variants, Transition } from "motion/react";
import React from "react";

const physicsTransition: Transition = {
    stiffness: 400,
    damping: 58,
    mass: 1,
};

interface LayerInViewAnimProps {
    based?: "time" | "physics";
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    duration?: number;
    delay?: number;
    bounce?: number;
    once?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const LayerInViewAnim = ({
    based = "time",
    scale = 1,
    offsetX = 0,
    offsetY = 30,
    duration = 1.5,
    delay = 0.4,
    bounce = 0.2,
    once = true,
    children,
    className,
}: LayerInViewAnimProps) => {
    const transition =
        based === "physics" ? physicsTransition : { duration, bounce };

    const variants: Variants = {
        hidden: {
            opacity: 0,
            x: offsetX,
            y: offsetY,
            scale: scale,
        },
        show: {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                ...transition,
                delay: delay,
            },
        },
    };

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            whileInView="show"
            viewport={{ once, amount: 0.5 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};