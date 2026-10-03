"use client";

import { useState, useRef, useCallback } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";
const TARGET = "code by zubeyr";

export const CodeBy = () => {
    const [displayText, setDisplayText] = useState(TARGET);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const iterationRef = useRef(0);

    const scramble = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        iterationRef.current = 0;

        intervalRef.current = setInterval(() => {
            const iteration = iterationRef.current;
            setDisplayText(
                TARGET.split("").map((char, i) => {
                    if (char === " ") return " ";
                    if (i < iteration) return TARGET[i];
                    return CHARS[Math.floor(Math.random() * CHARS.length)];
                }).join("")
            );
            iterationRef.current += 0.4;
            if (iterationRef.current >= TARGET.length) {
                clearInterval(intervalRef.current!);
                setDisplayText(TARGET);
            }
        }, 30);
    }, []);

    return (
        <a
            href="https://zubeyr.dev"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={scramble}
            className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wider select-none"
        >
            {displayText}
        </a>
    );
};
