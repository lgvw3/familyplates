"use client";

import { defaultModel, type modelID } from "@/ai/providers";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { DefaultChatTransport } from "ai";
import { Textarea } from "@/components/chat/textarea";
import ChatStarter from "@/components/chat/chat-starter";
import { Messages } from "@/components/chat/messages";
import { toast } from "sonner";
import { saveChatMessages } from "@/lib/chat/actions";

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState<modelID>(defaultModel);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, id } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error: Error) => {
      toast.error(
        error.message.length > 0
          ? error.message
          : "An error occurred, please try again later.",
        { position: "top-center", richColors: true },
      );
    },
    onFinish: async ({ messages }) => {
      await saveChatMessages(messages, id);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="h-[calc(100vh-50px)] flex flex-col justify-center w-full stretch">
      {messages.length === 0 ? (
        <div className="max-w-xl mx-auto w-full">
          <ChatStarter setInput={setInput} />
        </div>
      ) : (
        <Messages messages={messages} isLoading={isLoading} status={status} />
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const text = input.trim();
          if (!text || isLoading) return;

          setInput("");
          void sendMessage({ text }, { body: { selectedModel } });
        }}
        className="pb-8 bg-white dark:bg-black w-full max-w-xl mx-auto px-4 sm:px-0"
      >
        <Textarea
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          handleInputChange={(event) => setInput(event.target.value)}
          input={input}
          isLoading={isLoading}
          status={status}
          stop={stop}
        />
      </form>
    </div>
  );
}
