import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { aiGeneration, conversation } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { eq, and, desc } from 'drizzle-orm';
import { classifyUserIntention } from '@/lib/intention-classifier';

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
			message,
			conversationId,
		}: { message: string; conversationId?: string } = await req.json();

		// Classify user intention
		const intention = await classifyUserIntention(message);
		console.log('User intention:', intention);

		// Handle different intentions
		switch (intention) {
			case 'generate':
				return await handleGenerate(message, session.user.id, conversationId);

			case 'deploy':
				return await handleDeploy(session.user.id, conversationId);

			case 'both':
				// Generate first, then deploy
				const generateResult = await handleGenerate(
					message,
					session.user.id,
					conversationId,
				);
				if (generateResult.ok) {
					const generateData = await generateResult.json();
					// Deploy the generated content
					const deployResult = await handleDeploy(
						session.user.id,
						generateData.conversationId,
					);
					return Response.json({
						action: 'both',
						message: 'Website generated and deployed successfully!',
						generationId: generateData.generationId,
						conversationId: generateData.conversationId,
						deployUrl: deployResult.ok
							? (await deployResult.json()).deployUrl
							: null,
					});
				}
				return generateResult;

			case 'download':
				return await handleDownload(session.user.id, conversationId);

			case 'edit':
				return await handleEdit(message, session.user.id, conversationId);

			default:
				return Response.json({
					action: 'generate',
					message: "I'll help you generate a website!",
				});
		}
	} catch (error) {
		console.error('Agent error:', error);
		return Response.json({ error: 'Internal server error' }, { status: 500 });
	}
}

async function handleGenerate(
	message: string,
	userId: string,
	conversationId?: string,
) {
	// Generate website code
	const result = await generateText({
		model: google('gemini-2.5-flash'),
		system: systemPrompt,
		prompt: message,
	});

	const generatedHtml = result.text;
	const newGenerationId = nanoid();

	// Create or get conversation
	let currentConversationId = conversationId;
	if (!currentConversationId) {
		currentConversationId = nanoid();
		await db.insert(conversation).values({
			id: currentConversationId,
			userId: userId,
			title: message.slice(0, 50),
			description: message,
			currentGenerationId: newGenerationId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	// Save generation
	await db.insert(aiGeneration).values({
		id: newGenerationId,
		conversationId: currentConversationId,
		userId: userId,
		userPrompt: message,
		aiResponse: generatedHtml,
		version: 1,
		model: 'gemini-2.5-flash',
		status: 'completed',
		isCurrentVersion: true,
		deploymentStatus: 'not_deployed',
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return Response.json({
		action: 'generate',
		message: 'Website generated successfully!',
		generationId: newGenerationId,
		conversationId: currentConversationId,
		html: generatedHtml,
	});
}

async function handleDeploy(userId: string, conversationId?: string) {
	if (!conversationId) {
		return Response.json(
			{ error: 'No conversation ID provided for deployment' },
			{ status: 400 },
		);
	}

	// Get the latest generation
	const latestGeneration = await db
		.select()
		.from(aiGeneration)
		.where(
			and(
				eq(aiGeneration.conversationId, conversationId),
				eq(aiGeneration.isCurrentVersion, true),
			),
		)
		.limit(1);

	if (!latestGeneration.length) {
		return Response.json(
			{ error: 'No website found to deploy' },
			{ status: 400 },
		);
	}

	// For now, return mock deployment (you can integrate with actual deployment service)
	const deployUrl = `https://${nanoid()}.netlify.app`;

	return Response.json({
		action: 'deploy',
		message: 'Website deployed successfully!',
		deployUrl: deployUrl,
		generationId: latestGeneration[0].id,
	});
}

async function handleDownload(userId: string, conversationId?: string) {
	if (!conversationId) {
		return Response.json(
			{ error: 'No conversation ID provided for download' },
			{ status: 400 },
		);
	}

	// Get the latest generation
	const latestGeneration = await db
		.select()
		.from(aiGeneration)
		.where(
			and(
				eq(aiGeneration.conversationId, conversationId),
				eq(aiGeneration.isCurrentVersion, true),
			),
		)
		.limit(1);

	if (!latestGeneration.length) {
		return Response.json(
			{ error: 'No website found to download' },
			{ status: 400 },
		);
	}

	return Response.json({
		action: 'download',
		message: 'Website ready for download!',
		html: latestGeneration[0].aiResponse,
		filename: `website-${latestGeneration[0].id}.html`,
	});
}

async function handleEdit(
	message: string,
	userId: string,
	conversationId?: string,
) {
	if (!conversationId) {
		return Response.json(
			{ error: 'No conversation ID provided for editing' },
			{ status: 400 },
		);
	}

	// Get the current generation
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

	if (!currentGeneration.length) {
		return Response.json(
			{ error: 'No website found to edit' },
			{ status: 400 },
		);
	}

	const currentHtml = currentGeneration[0].aiResponse;

	// Generate edited version
	const result = await generateText({
		model: google('gemini-2.5-flash'),
		system: editSystemPrompt,
		prompt: `Please edit the following HTML code according to this request: "${message}"\n\nCurrent HTML:\n\`\`\`html\n${currentHtml}\n\`\`\`\n\nReturn only the updated HTML code with no explanations or markdown formatting.`,
	});

	const editedHtml = result.text;
	const newGenerationId = nanoid();

	// Mark current version as not current
	await db
		.update(aiGeneration)
		.set({ isCurrentVersion: false })
		.where(
			and(
				eq(aiGeneration.conversationId, conversationId),
				eq(aiGeneration.isCurrentVersion, true),
			),
		);

	// Save new edited version
	await db.insert(aiGeneration).values({
		id: newGenerationId,
		conversationId: conversationId,
		userId: userId,
		userPrompt: message,
		aiResponse: editedHtml,
		previousHtml: currentHtml,
		version: currentGeneration[0].version + 1,
		model: 'gemini-2.5-flash',
		status: 'completed',
		isCurrentVersion: true,
		deploymentStatus: 'not_deployed',
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return Response.json({
		action: 'edit',
		message: 'Website edited successfully!',
		generationId: newGenerationId,
		conversationId: conversationId,
		html: editedHtml,
	});
}
