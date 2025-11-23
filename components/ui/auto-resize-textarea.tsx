'use client'

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "./button";
import { ExpandIcon, XIcon } from "lucide-react";

interface AutoResizeTextareaProps {
    maxHeight?: number
    canGoFullScreen?: boolean
}

export function AutoResizeTextarea({ maxHeight = 200, canGoFullScreen = true, ...props }: AutoResizeTextareaProps & React.ComponentProps<"textarea">) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto"; // Reset height to recalculate
            textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`; // Grow until max height
            textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden"; // Enable scroll if needed
        }
    };

    useEffect(() => {
        adjustHeight()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Close full screen when pressing "Escape"
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isFullScreen) {
                setIsFullScreen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullScreen]);

    return (
        <>
            {!isFullScreen ? (
                // Regular Textarea Mode
                <div className="relative">
                    {
                        canGoFullScreen ?
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 z-10"
                                onClick={() => setIsFullScreen(true)}
                            >
                                <ExpandIcon size={18} />
                            </Button>
                            : null
                    }

                    <Textarea
                        {...props}
                        ref={textareaRef}
                        rows={1}
                        onInput={adjustHeight}
                        style={{
                            height: "auto",
                            maxHeight: `${maxHeight}px`,
                            overflowY: "hidden",
                            resize: "none",
                            paddingRight: canGoFullScreen ? "2.5rem" : undefined, // Add padding to prevent text overlap
                        }}
                    />
                </div>
            ) : (
                // Full-Window Mode - Rendered via Portal
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex flex-col p-6 bg-background">
                        {/* Close Button */}
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsFullScreen(false)}
                            >
                                <XIcon size={24} />
                            </Button>
                        </div>

                        {/* Full-Screen Textarea */}
                        <Textarea
                            {...props}
                            ref={textareaRef}
                            autoFocus
                            className="flex-1 text-lg p-4 w-full h-full"
                            style={{ resize: "none", overflowY: "auto" }}
                        />
                    </div>,
                    document.body
                )
            )}
        </>
    );
}
