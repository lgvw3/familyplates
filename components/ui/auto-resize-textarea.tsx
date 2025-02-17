import React, { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

interface AutoResizeTextareaProps {
    maxHeight?: number
}

export function AutoResizeTextarea({maxHeight=200, ...props}: AutoResizeTextareaProps & React.ComponentProps<"textarea">) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto"; // Reset height to recalculate
            textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`; // Grow until max height
            textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden"; // Enable scroll if needed
        }
    };

    return (
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
            }}
        />
    );
}
