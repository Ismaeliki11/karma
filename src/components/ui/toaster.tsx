"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
    return (
        <Sonner
            theme="light"
            className="toaster group"
            richColors
            closeButton
            position="top-center" // Mobile friendly default
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:text-neutral-950 group-[.toaster]:border-neutral-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl font-sans",
                    description: "group-[.toast]:text-neutral-500",
                    actionButton:
                        "group-[.toast]:bg-neutral-900 group-[.toast]:text-neutral-50",
                    cancelButton:
                        "group-[.toast]:bg-neutral-100 group-[.toast]:text-neutral-500",
                },
            }}
            {...props}
        />
    )
}
