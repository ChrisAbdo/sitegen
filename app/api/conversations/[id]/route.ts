import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { conversation, aiGeneration } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		// Get the authenticated session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return new Response('Unauthorized', { status: 401 });
		}

		const conversationId = (await params).id;

		// Fetch conversation with current generation
		const conversationResult = await db
			.select()
			.from(conversation)
			.where(
				and(
					eq(conversation.id, conversationId),
					eq(conversation.userId, session.user.id),
				),
			)
			.limit(1);

		if (conversationResult.length === 0) {
			return new Response('Conversation not found', { status: 404 });
		}

		const conv = conversationResult[0];

		// Fetch all generations for this conversation (to build message history)
		const allGenerations = await db
			.select()
			.from(aiGeneration)
			.where(eq(aiGeneration.conversationId, conversationId))
			.orderBy(desc(aiGeneration.version));

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

		// Convert generations to message format properly to avoid duplication
		const messages = [];
		const processedUserMessages = new Set(); // Track processed user messages to avoid duplicates

		for (const generation of allGenerations.reverse()) {
			// Reverse to get chronological order
			try {
				// Parse user prompts back to messages
				const userMessages = JSON.parse(generation.userPrompt);

				// Only add user messages that haven't been processed yet
				for (const userMsg of userMessages) {
					const msgKey = `${userMsg.role}-${JSON.stringify(userMsg.parts)}`;
					if (!processedUserMessages.has(msgKey)) {
						messages.push(userMsg);
						processedUserMessages.add(msgKey);
					}
				}

				// Add AI response (these should be unique by generation)
				messages.push({
					id: generation.id,
					role: 'assistant',
					parts: [{ type: 'text', text: generation.aiResponse }],
				});
			} catch (e) {
				// If parsing fails, create a simple message structure with unique IDs
				const userMessageId = `${generation.id}-user-${Date.now()}`;
				const userMsgKey = `user-${generation.userPrompt}`;

				if (!processedUserMessages.has(userMsgKey)) {
					messages.push({
						id: userMessageId,
						role: 'user',
						parts: [{ type: 'text', text: generation.userPrompt }],
					});
					processedUserMessages.add(userMsgKey);
				}

				messages.push({
					id: generation.id,
					role: 'assistant',
					parts: [{ type: 'text', text: generation.aiResponse }],
				});
			}
		}

		return Response.json({
			id: conv.id,
			title: conv.title,
			description: conv.description,
			currentGeneration,
			messages,
			createdAt: conv.createdAt,
			updatedAt: conv.updatedAt,
		});
	} catch (error) {
		console.error('Conversation API error:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		// Get the authenticated session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return new Response('Unauthorized', { status: 401 });
		}

		const conversationId = (await params).id;

		// Verify the conversation belongs to the user before deleting
		const conversationResult = await db
			.select()
			.from(conversation)
			.where(
				and(
					eq(conversation.id, conversationId),
					eq(conversation.userId, session.user.id),
				),
			)
			.limit(1);

		if (conversationResult.length === 0) {
			return new Response('Conversation not found', { status: 404 });
		}

		// Delete the conversation (this will cascade delete all associated aiGeneration records)
		await db
			.delete(conversation)
			.where(
				and(
					eq(conversation.id, conversationId),
					eq(conversation.userId, session.user.id),
				),
			);

		return new Response('Conversation deleted successfully', { status: 200 });
	} catch (error) {
		console.error('Delete conversation error:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}
