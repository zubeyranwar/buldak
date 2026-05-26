"use client";

import { motion, Variants, Transition, HTMLMotionProps } from "motion/react";
import React, { useMemo, ElementType } from "react";

const physicsTransition: Transition = {
    type: "spring",
    stiffness: 400,
    damping: 58,
    mass: 1,
};

type LayerInViewAnimProps<T extends ElementType = "div"> = {
    as?: T;
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
} & Omit<HTMLMotionProps<"div">, "as" | "children" | "className">;

export const LayerInViewAnim = <T extends ElementType = "div">({
    as,
    based = "time",
    scale = 1,
    offsetX = 0,
    offsetY = 30,
    duration = 1.5,
    delay,
    bounce = 0.2,
    once = true,
    children,
    className,
    ...rest
}: LayerInViewAnimProps<T>) => {
    const MotionComponent = motion(as ?? "div");

    const resolvedDelay = delay ?? (based === "physics" ? 0 : 0.4);

    const transition = useMemo<Transition>(
        () =>
            based === "physics"
                ? physicsTransition
                : { type: "spring", duration, bounce },
        [based, duration, bounce]
    );

    const variants = useMemo<Variants>(
        () => ({
            hidden: {
                opacity: 0,
                x: offsetX,
                y: offsetY,
                scale,
            },
            show: {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                transition: { ...transition, delay: resolvedDelay },
            },
        }),
        [offsetX, offsetY, scale, transition, resolvedDelay]
    );

    return (
        <MotionComponent
            variants={variants}
            initial="hidden"
            whileInView="show"
            viewport={{ once, amount: 0.5 }}
            className={className}
            {...rest}
        >
            {children}
        </MotionComponent>
    );
};