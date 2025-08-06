import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiGeneration } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
	try {
		// Get the authenticated session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { generationId, htmlContent } = await req.json();

		if (!generationId || !htmlContent) {
			return NextResponse.json(
				{ error: 'Missing generationId or htmlContent' },
				{ status: 400 },
			);
		}

		// Update the AI generation with new HTML content
		await db
			.update(aiGeneration)
			.set({
				aiResponse: htmlContent,
				updatedAt: new Date(),
			})
			.where(eq(aiGeneration.id, generationId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error updating HTML:', error);
		return NextResponse.json(
			{ error: 'Failed to update HTML' },
			{ status: 500 },
		);
	}
}
