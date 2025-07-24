import { google } from '@ai-sdk/google';
import {
	generateText,
	streamText,
	UIMessage,
	convertToModelMessages,
} from 'ai';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { aiGeneration, conversation } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const systemPrompt = `
You are an assistant that generates websites in only 1 html file with bootstrap for styling. You are going to receive a message input that is the request from the user (ex. 'I want a website for my restaurant...')... base your website on that. Output only the code and nothing else, not html title before <!DOCTYPE> or backtick added.
`;

const editSystemPrompt = `
You are an assistant that edits existing websites. You will receive the current HTML code and a request for changes. Modify the provided HTML according to the user's request and return only the complete updated HTML code with bootstrap styling. Output only the code and nothing else, not html title before <!DOCTYPE> or backtick added.
`;

export async function POST(req: Request) {
	try {
		// Get the authenticated session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return new Response('Unauthorized', { status: 401 });
		}

		const {
			messages,
			conversationId,
		}: { messages: UIMessage[]; conversationId?: string } = await req.json();

		// Store the conversation context as the prompt
		const userPrompt = JSON.stringify(
			messages.filter((msg) => msg.role === 'user'),
		);

		let currentConversation;
		let previousHtml: string | null = null;
		let version = 1;
		let isEdit = false;

		if (conversationId) {
			// Load existing conversation
			const existingConversation = await db
				.select()
				.from(conversation)
				.where(
					and(
						eq(conversation.id, conversationId),
						eq(conversation.userId, session.user.id),
					),
				)
				.limit(1);

			if (existingConversation.length > 0) {
				currentConversation = existingConversation[0];

				// Get the current version's HTML for context
				const currentGeneration = await db
					.select()
					.from(aiGeneration)
					.where(
						and(
							eq(aiGeneration.conversationId, conversationId),
							eq(aiGeneration.isCurrentVersion, true),
						),
					)
					.limit(1);

				if (currentGeneration.length > 0) {
					previousHtml = extractHtml(currentGeneration[0].aiResponse);
					version = currentGeneration[0].version + 1;
					isEdit = true;
				}
			}
		}

		if (!currentConversation) {
			// Create new conversation for first message
			const conversationTitle = generateTitle(userPrompt);
			const newConversationId = nanoid();

			await db.insert(conversation).values({
				id: newConversationId,
				userId: session.user.id,
				title: conversationTitle,
				description: conversationTitle,
			});

			currentConversation = {
				id: newConversationId,
				userId: session.user.id,
				title: conversationTitle,
				description: conversationTitle,
				currentGenerationId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
		}

		// Build the prompt based on whether this is an edit or new generation
		let promptMessages = convertToModelMessages(messages);

		if (isEdit && previousHtml) {
			// For edits, prepend the current HTML as context
			const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
			const editInstruction =
				lastUserMessage?.parts
					?.filter((part) => part.type === 'text')
					?.map((part) => part.text)
					?.join('') || '';

			promptMessages = [
				{
					role: 'system' as const,
					content: `${editSystemPrompt}\n\nCurrent HTML:\n\`\`\`html\n${previousHtml}\n\`\`\`\n\nEdit request: ${editInstruction}`,
				},
			];
		}

		// Mark previous version as not current if this is an edit
		if (isEdit) {
			await db
				.update(aiGeneration)
				.set({ isCurrentVersion: false })
				.where(
					and(
						eq(aiGeneration.conversationId, currentConversation.id),
						eq(aiGeneration.isCurrentVersion, true),
					),
				);
		}

		// Create streaming response and save the result
		const result = streamText({
			model: google('gemini-2.5-flash'),
			system: isEdit ? editSystemPrompt : systemPrompt,
			messages: promptMessages,
		});

		// Generate a unique ID for this generation
		const generationId = nanoid();

		// Start streaming response but also collect the full text for database
		let fullText = '';
		const originalStream = result.toUIMessageStreamResponse();

		// Create a transform stream to collect the text while streaming
		const transformStream = new TransformStream({
			transform(chunk, controller) {
				// Parse chunk to extract text content
				const chunkStr = new TextDecoder().decode(chunk);
				const lines = chunkStr.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ') && line !== 'data: [DONE]') {
						try {
							const data = JSON.parse(line.slice(6));
							if (data.type === 'text' && data.text) {
								fullText += data.text;
							}
						} catch (e) {
							// Ignore parse errors
						}
					}
				}

				controller.enqueue(chunk);
			},
			flush() {
				// Save to database when streaming is complete
				db.insert(aiGeneration)
					.values({
						id: generationId,
						conversationId: currentConversation.id,
						userId: session.user.id,
						version,
						userPrompt,
						aiResponse: fullText,
						previousHtml,
						model: 'gemini-2.5-flash',
						status: 'completed',
						isCurrentVersion: true,
					})
					.then(() => {
						// Update conversation's current generation ID
						return db
							.update(conversation)
							.set({
								currentGenerationId: generationId,
								updatedAt: new Date(),
							})
							.where(eq(conversation.id, currentConversation.id));
					})
					.catch((dbError) => {
						console.error('Error saving to database:', dbError);
					});
			},
		});

		// Add conversation ID to response headers
		originalStream.headers.set('X-Conversation-ID', currentConversation.id);

		// Return the transformed stream
		return new Response(originalStream.body?.pipeThrough(transformStream), {
			headers: originalStream.headers,
			status: originalStream.status,
		});
	} catch (error) {
		console.error('Chat API error:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}

// Helper function to extract HTML from markdown code blocks
function extractHtml(content: string): string {
	const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/);
	if (htmlMatch) {
		return htmlMatch[1].trim();
	}

	const generalMatch = content.match(/```\s*([\s\S]*?)\s*```/);
	if (generalMatch) {
		return generalMatch[1].trim();
	}

	return content.trim();
}

// Helper function to generate conversation title from first prompt
function generateTitle(userPrompt: string): string {
	try {
		const messages = JSON.parse(userPrompt);
		const firstMessage = messages[0];
		const firstMessageText =
			firstMessage?.parts
				?.filter((part: any) => part.type === 'text')
				?.map((part: any) => part.text)
				?.join('') || '';

		// Extract key words for title (limit to ~50 chars)
		const title = firstMessageText
			.replace(/[^a-zA-Z0-9\s]/g, '')
			.split(' ')
			.slice(0, 6)
			.join(' ');

		return title || 'Website Project';
	} catch {
		return 'Website Project';
	}
}
