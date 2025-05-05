"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { memo } from "react";

interface SuggestedPromptsProps {
  sendMessage: (input: string) => void;
}

function PureSuggestedPrompts({ sendMessage }: SuggestedPromptsProps) {
  const suggestedActions = [
    {
      title: "What insights on faith",
      label: "in Jesus Christ have been shared?",
      action: "What insights on faith in Jesus Christ have been shared?",
    },
    {
      title: "Help me plan a family home evening",
      label: "based on ideas about repentance shared by family members",
      action: "Help me plan a family home evening based on ideas about repentance shared by family members",
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full mx-2 pb-2"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              sendMessage(suggestedAction.action);
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 w-full h-auto justify-start items-start flex-col text-wrap"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedPrompts = memo(PureSuggestedPrompts, () => true);
