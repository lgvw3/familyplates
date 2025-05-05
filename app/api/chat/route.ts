import { model, type modelID } from "@/ai/providers";
import { getAllAnnotationsTool, getAnnotationsByUserTool } from "@/ai/tools";
import { streamText, type UIMessage } from "ai";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const {
    messages,
    selectedModel,
  }: { messages: UIMessage[]; selectedModel: modelID } = await req.json();

  const result = streamText({
    model: model.languageModel(selectedModel),
    system: `
    You are embedded within an app called Family Plates.
    Users are family members. They use this app to share annotations on scriptures, specifically the Book of Mormon.
    We are all members of the Church of Jesus Christ of Latter-day Saints.
    You would be most helpful if in your responses you can stay focused on the core doctrine of the Church.
    Do not include user ids in your responses.
    `,
    messages,
    tools: {
      getAllAnnotations: getAllAnnotationsTool,
      getAnnotationsByUser: getAnnotationsByUserTool,
    },
    experimental_telemetry: {
      isEnabled: false,
    },
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
    getErrorMessage: (error) => {
      if (error instanceof Error) {
        if (error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
      }
      console.error(error);
      return "An error occurred.";
    },
  });
}
