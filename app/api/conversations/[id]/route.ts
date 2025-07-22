import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { conversation, aiGeneration } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const conversationId = (await params).id;

    // Fetch conversation with current generation
    const conversationResult = await db
      .select()
      .from(conversation)
      .where(
        and(
          eq(conversation.id, conversationId),
          eq(conversation.userId, session.user.id)
        )
      )
      .limit(1);

    if (conversationResult.length === 0) {
      return new Response("Conversation not found", { status: 404 });
    }

    const conv = conversationResult[0];

    // Fetch current generation if it exists
    let currentGeneration = null;
    if (conv.currentGenerationId) {
      const generationResult = await db
        .select()
        .from(aiGeneration)
        .where(eq(aiGeneration.id, conv.currentGenerationId))
        .limit(1);

      if (generationResult.length > 0) {
        currentGeneration = generationResult[0];
      }
    }

    return Response.json({
      id: conv.id,
      title: conv.title,
      description: conv.description,
      currentGeneration,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    });
  } catch (error) {
    console.error("Conversation API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
