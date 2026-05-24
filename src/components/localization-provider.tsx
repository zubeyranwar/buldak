"use client";

import i18n from "@/lib/i18n";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

export const LocalizationProvider = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    )
}