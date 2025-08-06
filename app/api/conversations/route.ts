import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { conversation, aiGeneration } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
	try {
		// Get the authenticated session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return new Response('Unauthorized', { status: 401 });
		}

		// Fetch all conversations for the user, ordered by most recent
		const conversations = await db
			.select({
				id: conversation.id,
				title: conversation.title,
				description: conversation.description,
				currentGenerationId: conversation.currentGenerationId,
				createdAt: conversation.createdAt,
				updatedAt: conversation.updatedAt,
			})
			.from(conversation)
			.where(eq(conversation.userId, session.user.id))
			.orderBy(desc(conversation.updatedAt));

		// For each conversation, get the current generation if it exists
		const conversationsWithGenerations = await Promise.all(
			conversations.map(async (conv) => {
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

				return {
					...conv,
					currentGeneration,
				};
			}),
		);

		return Response.json(conversationsWithGenerations);
	} catch (error) {
		console.error('Conversations list API error:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}
