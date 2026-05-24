"use client";

import { motion } from "motion/react";

const heroHeadingTextVariants = {
    hidden: {
        opacity: 0,
        scale: 1,
        filter: "blur(10px)",
        y: 20,
    },
    show: (index: number) => ({
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        y: 0,
        transition: {
            type: "spring",
            stiffness: 120,
            damping: 40,
            mass: 1,
            delay: 0.1 + index * 0.05,
        },
    }),
} as const;

const heroTextLines = ["Your,Korean", " Comfort Corner"];

const heroCharacters = heroTextLines.flatMap((line, lineIndex) =>
    line.split("").map((char, charIndex) => ({
        char,
        key: `${lineIndex}-${charIndex}-${char}`,
        lineIndex,
    }))
);

export const HeroHeadingText = () => {
    return (
        <motion.h1
            className="text-heading-2! md:text-heading-1!"
            variants={heroHeadingTextVariants as any}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
        >
            {heroCharacters.map((character, index) => {
                const isSpace = character.char === " ";
                const shouldBreakLine =
                    character.lineIndex === 0 && index === heroTextLines[0].length - 1;

                return (
                    <span key={character.key}>
                        {isSpace ? (
                            <span>&nbsp;</span>
                        ) : (
                            <motion.span
                                variants={heroHeadingTextVariants as any}
                                custom={index}
                                className="inline-block will-change-transform"
                            >
                                {character.char}
                            </motion.span>
                        )}
                        {shouldBreakLine ? <br className="hidden md:block" /> : null}
                    </span>
                );
            })}
        </motion.h1>
    )
}