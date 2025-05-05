"use client";

import { defaultModel, type modelID } from "@/ai/providers";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Textarea } from "@/components/chat/textarea";
import ChatStarter from "@/components/chat/chat-starter";
import { Messages } from "@/components/chat/messages";
import { toast } from "sonner";

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState<modelID>(defaultModel);
  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat({
      maxSteps: 5,
      body: {
        selectedModel,
      },
      onError: (error: Error) => {
        toast.error(
          error.message.length > 0
            ? error.message
            : "An error occured, please try again later.",
          { position: "top-center", richColors: true },
        );
      },
    });

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="h-[calc(100vh-50px)] flex flex-col justify-center w-full stretch">
      {messages.length === 0 ? (
        <div className="max-w-xl mx-auto w-full">
          <ChatStarter />
        </div>
      ) : (
        <Messages messages={messages} isLoading={isLoading} status={status} />
      )}
      <form
        onSubmit={handleSubmit}
        className="pb-8 bg-white dark:bg-black w-full max-w-xl mx-auto px-4 sm:px-0"
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
