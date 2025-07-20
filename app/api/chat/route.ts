import { google } from "@ai-sdk/google";
import {
  generateText,
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { aiGeneration } from "@/lib/db/schema";
import { nanoid } from "nanoid";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const systemPrompt = `
You are an assistant that generates websites in only 1 html file with bootstrap for styling. You are going to receive a message input that is the request from the user (ex. 'I want a website for my restaurant...')... base your website on that. Output only the code and nothing else.
`;

export async function POST(req: Request) {
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    // Store the conversation context as the prompt
    const userPrompt = JSON.stringify(
      messages.filter((msg) => msg.role === "user")
    );

    // First generate the complete response for database storage
    const { text: generatedText } = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
    });

    // Save to database
    const generationId = nanoid();
    try {
      await db.insert(aiGeneration).values({
        id: generationId,
        userId: session.user.id,
        userPrompt,
        aiResponse: generatedText,
        model: "gemini-2.5-flash",
        status: "completed",
      });
    } catch (dbError) {
      console.error("Error saving to database:", dbError);
      // Continue even if database save fails
    }

    // Now create a streaming response for the user
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
