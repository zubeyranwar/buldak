"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";

const languages = [
    {
        code: "en",
        label: "English",
        short: "EN",
    },
    {
        code: "am",
        label: "አማርኛ",
        short: "አማ",
    },
];

export const LanguageSelector = () => {
    const { i18n } = useTranslation();

    const savedLanguage =
        typeof window !== "undefined"
            ? localStorage.getItem("userLanguage")
            : null;

    const [language, setLanguage] = useState(
        savedLanguage || i18n.language || "en"
    );

    const [open, setOpen] = useState(false);

    const currentLanguage = languages.find(
        (item) => item.code === language
    );

    const handleLanguageChange = async (code: string) => {
        setLanguage(code);

        await i18n.changeLanguage(code);

        localStorage.setItem("userLanguage", code);

        setOpen(false);
    };

    useEffect(() => {
        void i18n.changeLanguage(language);
    }, []);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl font-bold"
                >
                    {currentLanguage?.short}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-40 p-1"
            >
                <div className="flex flex-col gap-1">
                    {languages.map((item) => {
                        const active = item.code === language;

                        return (
                            <Button
                                key={item.code}
                                variant={active ? "secondary" : "ghost"}
                                className="justify-start"
                                onClick={() =>
                                    handleLanguageChange(item.code)
                                }
                            >
                                {item.label}
                            </Button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
};