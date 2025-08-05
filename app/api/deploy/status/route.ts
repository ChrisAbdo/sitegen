import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { aiGeneration } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
	try {
		// Get the authenticated session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return new Response('Unauthorized', { status: 401 });
		}

		const { generationId, deploymentUrl } = await req.json();

		if (!generationId) {
			return new Response('Generation ID is required', { status: 400 });
		}

		// Update generation with manual deployment info
		await db
			.update(aiGeneration)
			.set({
				deploymentStatus: 'deployed',
				deploymentUrl: deploymentUrl || null,
				deploymentId: `manual-${Date.now()}`,
				deployedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(aiGeneration.id, generationId));

		return Response.json({
			success: true,
			message: 'Deployment status updated successfully',
		});
	} catch (error) {
		console.error('Error updating deployment status:', error);
		return new Response('Failed to update deployment status', { status: 500 });
	}
}
