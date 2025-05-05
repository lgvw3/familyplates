import { fetchAllAnnotations, fetchAnnotationsByUser } from "@/lib/annotations/data";
import { accounts } from "@/lib/auth/accounts";
import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Get the weather in a location",
  parameters: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
  }),
});

export const getAllAnnotationsTool = tool({
  description: "Get all annotations",
  parameters: z.object({}).optional(),
  execute: async () => (await fetchAllAnnotations(true)) ?? 'No annotations found'
});

export const getAnnotationsByUserTool = tool({
  description: "Get all annotations by user",
  parameters: z.object({
    userName: z.string().describe("The user name to get annotations for"),
  }),
  execute: async ({userName}) => {
    if (!userName) {
      return 'No user name provided'
    }
    let userId: number | null = null
    accounts.map(a => {
      if (a.name.toLowerCase() === userName.toLowerCase()) {
        userId = a.id
      }
      else if (a.name.toLowerCase().includes(userName.toLowerCase())) {
        userId = a.id
      }
    })
    if (!userId) {
      return 'User not found'
    }
    return await fetchAnnotationsByUser(userId, true)
  }
});

