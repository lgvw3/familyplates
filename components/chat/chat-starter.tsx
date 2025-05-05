import { SuggestedPrompts } from "./suggested-prompts";

export default function ChatStarter({ setInput }: { setInput: (input: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-end">
      <h1 className="text-3xl font-semibold mb-4">Family Plates Chat</h1>
      <p className="text-center">
        Use this chatbot to ask about annotations shared by family members.
      </p>
      <div className="w-full">
        <SuggestedPrompts sendMessage={setInput} />
      </div>
    </div>
  );
};


