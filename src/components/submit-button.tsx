"use client";

import { useFormStatus } from "react-dom"
import { Button } from "./ui/button"

interface SubmitButtonProps {
    label: string
    loadingText: string
}

export const SubmitButton = ({ label, loadingText }: SubmitButtonProps) => {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending} className="mt-4">
            {pending ? loadingText : label}
        </Button>
    )
}
