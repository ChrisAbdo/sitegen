import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiGeneration } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
	try {
		// Get the authenticated session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch user's AI generations
		const generations = await db
			.select()
			.from(aiGeneration)
			.where(eq(aiGeneration.userId, session.user.id))
			.orderBy(desc(aiGeneration.createdAt));

		return NextResponse.json(generations);
	} catch (error) {
		console.error('Error fetching generations:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 },
		);
	}
}
