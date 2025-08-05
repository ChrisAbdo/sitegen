import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { aiGeneration } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(req: NextRequest) {
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

		// Get the generation data first
		const generation = await db
			.select()
			.from(aiGeneration)
			.where(eq(aiGeneration.id, generationId))
			.limit(1);

		if (generation.length === 0) {
			return new Response('Generation not found', { status: 404 });
		}

		const gen = generation[0];

		// Log generation details for debugging
		console.log('Generation details:', {
			id: gen.id,
			deploymentStatus: gen.deploymentStatus,
			deploymentId: gen.deploymentId,
			deploymentUrl: gen.deploymentUrl,
			userId: gen.userId,
		});

		// Check if user owns this generation
		if (gen.userId !== session.user.id) {
			return new Response('Forbidden', { status: 403 });
		}

		// If the site is deployed or deploying, delete from Netlify first
		if (
			gen.deploymentStatus === 'deployed' ||
			gen.deploymentStatus === 'deploying'
		) {
			if (!process.env.NETLIFY_ACCESS_TOKEN) {
				console.warn(
					'Netlify access token not configured, skipping Netlify deletion',
				);
			} else if (gen.deploymentId) {
				try {
					console.log('Deleting site from Netlify, site ID:', gen.deploymentId);

					// Use the stored deploymentId which is the actual Netlify site ID
					const siteId = gen.deploymentId;

					// Delete the site from Netlify using the correct API endpoint
					const deleteResponse = await fetch(
						`https://api.netlify.com/api/v1/sites/${siteId}`,
						{
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
								'Content-Type': 'application/json',
							},
						},
					);

					// Log response status for debugging
					console.log('Netlify delete response status:', deleteResponse.status);

					if (!deleteResponse.ok) {
						const errorText = await deleteResponse.text();
						console.error(
							'Failed to delete site from Netlify:',
							deleteResponse.status,
							errorText,
						);
						// Continue with database deletion even if Netlify deletion fails
					} else {
						console.log('Successfully deleted site from Netlify');
					}
				} catch (error) {
					console.error('Error deleting site from Netlify:', error);
					// Continue with database deletion even if Netlify deletion fails
				}
			} else {
				console.warn('No deployment ID found, skipping Netlify deletion');
			}

			// Update the generation status to 'not_deployed' instead of deleting if it was deployed
			await db
				.update(aiGeneration)
				.set({
					deploymentStatus: 'not_deployed',
					deploymentUrl: null,
					deploymentId: null,
					deployedAt: null,
					updatedAt: new Date(),
				})
				.where(eq(aiGeneration.id, generationId));

			return Response.json({
				success: true,
				message:
					'Website deleted from Netlify and status updated to not deployed',
				action: 'website_deleted',
			});
		} else {
			// If not deployed, delete the entire generation from database
			await db.delete(aiGeneration).where(eq(aiGeneration.id, generationId));

			return Response.json({
				success: true,
				message: 'Generation deleted from database',
				action: 'generation_deleted',
			});
		}
	} catch (error) {
		console.error('Delete error:', error);
		return new Response('Failed to delete', { status: 500 });
	}
}
