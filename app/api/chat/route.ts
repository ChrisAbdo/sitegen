import { google } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system:
      "You are an assistant that generates websites in only 1 html file with bootstrap for styling. You are going to receive a message input that is the request from the user (ex. 'I want a website for my restaurant...')... base your website on that. Output only the code and nothing else.",
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
