"use client";

import { motion, Variants } from "motion/react";
import React from "react";

const containerVariants: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0.1,
        },
    },
};

const charVariants: Variants = {
    hidden: {
        opacity: 0,
        filter: "blur(10px)",
        y: 20,
    },
    show: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: {
            type: "spring",
            stiffness: 120,
            damping: 40,
            mass: 1,
        },
    },
};

const heroTextLines = ["Your, Korean", "Comfort Corner"];

export const HeroHeadingText = () => {
    return (
        <motion.h1
            className="text-heading-2! md:text-heading-1!"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
        >
            {heroTextLines.map((line, lineIndex) => (
                <React.Fragment key={lineIndex}>
                    {line.split(" ").map((word, wordIndex) => (
                        <React.Fragment key={wordIndex}>
                            {wordIndex > 0 && " "}
                            <span style={{ whiteSpace: "nowrap" }}>
                                {word.split("").map((char, charIndex) => (
                                    <motion.span
                                        key={charIndex}
                                        variants={charVariants}
                                        className="inline-block will-change-transform"
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </span>
                        </React.Fragment>
                    ))}
                    {lineIndex < heroTextLines.length - 1 && (
                        <br className="hidden md:block" />
                    )}
                </React.Fragment>
            ))}
        </motion.h1>
    );
};