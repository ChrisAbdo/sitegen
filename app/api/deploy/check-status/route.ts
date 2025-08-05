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

		const { generationId } = await req.json();

		if (!generationId) {
			return new Response('Generation ID is required', { status: 400 });
		}

		// Get the generation data
		const generation = await db
			.select()
			.from(aiGeneration)
			.where(eq(aiGeneration.id, generationId))
			.limit(1);

		if (generation.length === 0) {
			return new Response('Generation not found', { status: 404 });
		}

		const gen = generation[0];

		// Check if user owns this generation
		if (gen.userId !== session.user.id) {
			return new Response('Forbidden', { status: 403 });
		}

		// Only check status if it's currently deploying and we have a site ID
		if (
			gen.deploymentStatus !== 'deploying' ||
			!gen.deploymentId ||
			!process.env.NETLIFY_ACCESS_TOKEN
		) {
			return Response.json({
				status: gen.deploymentStatus,
				url: gen.deploymentUrl,
				message: 'No status check needed',
			});
		}

		try {
			// Check deployment status using Netlify API
			const siteInfoResponse = await fetch(
				`https://api.netlify.com/api/v1/sites/${gen.deploymentId}`,
				{
					headers: {
						Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
					},
				},
			);

			if (!siteInfoResponse.ok) {
				throw new Error('Failed to fetch site info');
			}

			const siteInfo = await siteInfoResponse.json();
			console.log(
				'Site deployment state for',
				generationId,
				':',
				siteInfo.published_deploy?.state,
			);

			let newStatus = gen.deploymentStatus;
			let newUrl = gen.deploymentUrl;

			// Update status based on Netlify API response
			if (siteInfo.published_deploy?.state === 'ready') {
				newStatus = 'deployed';
				newUrl = siteInfo.url || gen.deploymentUrl;
			} else if (
				siteInfo.published_deploy?.state === 'error' ||
				siteInfo.published_deploy?.state === 'failed'
			) {
				newStatus = 'failed';
			}
			// If still building/enqueued, keep as 'deploying'

			// Update database if status changed
			if (newStatus !== gen.deploymentStatus || newUrl !== gen.deploymentUrl) {
				await db
					.update(aiGeneration)
					.set({
						deploymentStatus: newStatus,
						deploymentUrl: newUrl,
						deployedAt: newStatus === 'deployed' ? new Date() : gen.deployedAt,
						updatedAt: new Date(),
					})
					.where(eq(aiGeneration.id, generationId));
			}

			return Response.json({
				status: newStatus,
				url: newUrl,
				changed: newStatus !== gen.deploymentStatus,
				message: `Status checked: ${newStatus}`,
			});
		} catch (error) {
			console.error('Error checking deployment status:', error);
			return Response.json({
				status: gen.deploymentStatus,
				url: gen.deploymentUrl,
				message: 'Failed to check status',
			});
		}
	} catch (error) {
		console.error('Status check error:', error);
		return new Response('Failed to check status', { status: 500 });
	}
}
