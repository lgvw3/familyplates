import { fetchAllAnnotations, fetchAnnotationsByUser } from "@/lib/annotations/data";
import { fetchFamilyAccounts } from "@/lib/auth/profiles";
import { tool } from "ai";
import { z } from "zod";

export const weatherTool = tool({
  description: "Get the weather in a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
  }),
});

export const getAllAnnotationsTool = tool({
  description: "Get all annotations",
  inputSchema: z.object({}),
  execute: async () => (await fetchAllAnnotations(true)) ?? 'No annotations found'
});

export const getAnnotationsByUserTool = tool({
  description: "Get all annotations by user",
  inputSchema: z.object({
    userName: z.string().describe("The user name to get annotations for"),
  }),
  execute: async ({userName}) => {
    if (!userName) {
      return 'No user name provided'
    }
    const normalizedName = userName.trim().toLowerCase()
    const family = await fetchFamilyAccounts()
    const exactMatch = family.find(account => account.name.toLowerCase() === normalizedName)
    const partialMatches = family.filter(account => account.name.toLowerCase().includes(normalizedName))
    const match = exactMatch ?? (partialMatches.length === 1 ? partialMatches[0] : undefined)
    if (!match) {
      return 'User not found'
    }
    return await fetchAnnotationsByUser(match.id, true)
  }
});
