"use client";

import { defaultModel, type modelID } from "@/ai/providers";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/chat/textarea";
import { Messages } from "@/components/chat/messages";
import { toast } from "sonner";
import { saveChatMessages } from "@/lib/chat/actions";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon } from "lucide-react";

interface ContextualChatProps {
  selectedText: string;
  context: {
    book: string;
    chapter: number;
    verseNumbers: number[];
  };
  onBackToReading: () => void;
  onAskAnotherQuestion: () => void;
}

export default function ContextualChat({ 
  selectedText, 
  context, 
  onBackToReading, 
  onAskAnotherQuestion 
}: ContextualChatProps) {
  const [selectedModel, setSelectedModel] = useState<modelID>(defaultModel);
  
  // Create initial context message
  const initialContext = `I'm studying ${context.book} chapter ${context.chapter}, specifically verses ${context.verseNumbers.join(', ')}. Here's the text I've highlighted: "${selectedText}". Can you help me understand this passage better? I'm interested in the historical context, meaning, and any insights you might have.`;

  const { messages, input, setInput, handleInputChange, handleSubmit, status, stop, id } =
    useChat({
      maxSteps: 5,
      body: {
        selectedModel,
      },
      initialMessages: [
        {
          id: 'context',
          role: 'user',
          content: initialContext,
        }
      ],
      onError: (error: Error) => {
        toast.error(
          error.message.length > 0
            ? error.message
            : "An error occurred, please try again later.",
          { position: "top-center", richColors: true },
        );
      },
      onFinish: async () => {
        await saveChatMessages(messages, id);
      },
    });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-submit the initial context
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'user') {
      handleSubmit(new Event('submit') as any);
    }
  }, []);

  return (
    <div className="h-[calc(100vh-50px)] flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToReading}
          className="flex items-center gap-2"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <BookOpenIcon className="h-4 w-4" />
          Back to Reading
        </Button>
        
        <div className="text-center">
          <h2 className="text-sm font-medium">AI Insights</h2>
          <p className="text-xs text-muted-foreground">
            {context.book} {context.chapter}:{context.verseNumbers.join(', ')}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onAskAnotherQuestion}
          className="flex items-center gap-2"
        >
          Ask Again
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Context Display */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 border-b">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Selected Text:
        </p>
        <p className="text-sm italic text-blue-800 dark:text-blue-200">
          "{selectedText}"
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <Messages messages={messages} isLoading={isLoading} status={status} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="pb-8 bg-white dark:bg-black w-full px-4"
      >
        <Textarea
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          handleInputChange={handleInputChange}
          input={input}
          isLoading={isLoading}
          status={status}
          stop={stop}
        />
      </form>
    </div>
  );
} 