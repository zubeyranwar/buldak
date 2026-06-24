"use client"

import { motion, Variant } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface TooltipPosition {
    x: number;
    y: number
}
// on hover i want to appear tooltip
export const CodeBy = () => {
    const containerRef = useRef<HTMLDivElement | null>(null)

    const [onHover, setOnHover] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | undefined>(undefined);

    useEffect(() => {
        if (!containerRef.current) return

        const mouseEnter = containerRef.current.addEventListener("mouseenter", () => {
            setOnHover(true);
            console.log({ mouseEnter: true })
        })

        const mouseMove = containerRef.current.addEventListener("mousemove", (e) => {
            const clientX = e.clientX;
            const clientY = e.clientY;

            setTooltipPosition({ x: clientX, y: clientY })
        })

        const mouseLeave = containerRef.current.addEventListener("mouseleave", () => {
            setOnHover(false)
            console.log({ mouseLeave: true })
        })

        return () => {
            containerRef.current?.removeEventListener("mouseenter", mouseEnter)
            containerRef.current?.removeEventListener("mouseleave", mouseLeave)
            containerRef.current?.removeEventListener("mousemove", mouseMove)
        }
    }, [])

    useEffect(() => {

    }, [])

    const variant: Variant = {}

    return (
        <div className="relative" ref={containerRef}>
            <p className="text-gray! shrink-0">
                Built By Zubeyr
            </p>

            {onHover && <motion.div>
                <div className={`absolute top-4 left-2 bg-black-80 h-12`}>
                    <a className="text-white">zubeyranwar.vercel.app</a>
                </div>
            </motion.div>}
        </div>
    )
}