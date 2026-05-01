"use client";
import { motion, Variants } from "motion/react";

const heroParagraphTextVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 1,
    y: 30,
  },
  show: () => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.2,
      duration: 1.5,
      delay: 0.4,
    },
  }),
} as const;

export const HeroParagraphText = () => {
  return (
    <motion.div
      variants={heroParagraphTextVariants as any}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      className="w-[20%]">
      <p className="body-low">
        Spicy chicken & Korean foods — served daily from 8 AM to 8 PM behind skylight hotel, Addis Ababa
      </p>
    </motion.div>
  )
}
