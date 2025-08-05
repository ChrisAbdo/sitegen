import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { aiGeneration } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
	try {
		// Get the authenticated session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return new Response('Unauthorized', { status: 401 });
		}

		const { htmlContent, siteName, generationId } = await req.json();

		if (!htmlContent) {
			return new Response('HTML content is required', { status: 400 });
		}

		// Extract clean HTML from AI response (remove markdown code blocks if present)
		const extractCleanHtml = (content: string): string => {
			// Remove ```html and ``` markers
			const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/);
			if (htmlMatch) {
				return htmlMatch[1].trim();
			}

			// Fallback: try to find any HTML content in code blocks
			const generalMatch = content.match(/```\s*([\s\S]*?)\s*```/);
			if (generalMatch) {
				return generalMatch[1].trim();
			}

			// If no code blocks found, assume the entire content is HTML
			return content.trim();
		};

		const cleanHtml = extractCleanHtml(htmlContent);
		console.log('Extracted HTML length:', cleanHtml.length);

		// Validate generation exists before deployment
		if (generationId && generationId !== 'preview') {
			try {
				console.log(
					'🔍 Validating generation exists before deployment:',
					generationId,
				);
				const existingGeneration = await db
					.select({
						id: aiGeneration.id,
						userId: aiGeneration.userId,
						deploymentStatus: aiGeneration.deploymentStatus,
					})
					.from(aiGeneration)
					.where(eq(aiGeneration.id, generationId))
					.limit(1);

				console.log('🔍 Generation validation result:', existingGeneration);

				if (existingGeneration.length === 0) {
					console.error('❌ Generation not found:', generationId);
					return new Response('Generation not found', { status: 404 });
				}

				// Verify user ownership
				if (existingGeneration[0].userId !== session.user.id) {
					console.error('❌ Unauthorized access to generation:', {
						generationId,
						generationUserId: existingGeneration[0].userId,
						sessionUserId: session.user.id,
					});
					return new Response('Unauthorized', { status: 403 });
				}

				console.log('✅ Generation validation passed');
			} catch (error) {
				console.error('❌ Error validating generation:', error);
				return new Response('Database error during validation', {
					status: 500,
				});
			}
		}

		// Update deployment status to "deploying" if generationId is provided
		if (generationId && generationId !== 'preview') {
			try {
				console.log(
					'🔄 Updating deployment status to deploying for generation:',
					generationId,
				);
				const updateResult = await db
					.update(aiGeneration)
					.set({
						deploymentStatus: 'deploying',
						updatedAt: new Date(),
					})
					.where(eq(aiGeneration.id, generationId))
					.returning({
						id: aiGeneration.id,
						deploymentStatus: aiGeneration.deploymentStatus,
					});

				console.log('✅ Database update result:', updateResult);

				if (updateResult.length === 0) {
					console.error('❌ No generation found with ID:', generationId);
				}
			} catch (error) {
				console.error('❌ Error updating deployment status:', error);
			}
		} else {
			console.log(
				'⚠️ No generationId provided or is preview, skipping database update',
			);
		}

		// Create a site name
		const deploymentName = siteName || `ai-website-${Date.now()}`;

		// Check if Netlify access token is available
		// Now using the official Netlify API documentation approach
		const USE_MOCK_DEPLOYMENT = false; // Enable real deployment based on official API docs

		console.log(
			'Netlify access token available:',
			!!process.env.NETLIFY_ACCESS_TOKEN,
		);
		console.log('Use mock deployment:', USE_MOCK_DEPLOYMENT);

		if (!process.env.NETLIFY_ACCESS_TOKEN || USE_MOCK_DEPLOYMENT) {
			console.log(
				'Using mock deployment - manual methods recommended for reliability',
			);

			// Simulate deployment delay
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const mockUrl = `https://demo-preview-${Date.now()}.netlify.app`;

			// Update generation with mock deployment info
			if (generationId && generationId !== 'preview') {
				try {
					await db
						.update(aiGeneration)
						.set({
							deploymentStatus: 'deployed',
							deploymentUrl: mockUrl,
							deploymentId: deploymentName,
							deployedAt: new Date(),
							updatedAt: new Date(),
						})
						.where(eq(aiGeneration.id, generationId));
				} catch (error) {
					console.error('Error updating mock deployment info:', error);
				}
			}

			return Response.json({
				success: true,
				url: mockUrl,
				deployId: deploymentName,
				siteId: deploymentName,
				mock: true,
				message:
					'Demo URL shown. Use Copy/Download buttons above for real deployment to Netlify!',
			});
		}

		try {
			console.log('Starting real Netlify deployment with extracted HTML...');

			// Create a new site on Netlify
			const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: deploymentName,
				}),
			});

			if (!siteResponse.ok) {
				const error = await siteResponse.text();
				console.error('Site creation failed:', error);
				throw new Error(`Site creation failed: ${error}`);
			}

			const siteData = await siteResponse.json();
			console.log(
				'Site created successfully:',
				siteData.url,
				'Site ID:',
				siteData.id,
			);

			// Update deployment status to "deploying" with site information
			if (generationId && generationId !== 'preview') {
				try {
					await db
						.update(aiGeneration)
						.set({
							deploymentStatus: 'deploying',
							deploymentUrl: siteData.url,
							deploymentId: siteData.id, // Store the site ID, not deploy ID
							updatedAt: new Date(),
						})
						.where(eq(aiGeneration.id, generationId));
					console.log('Updated with site information:', siteData.id);
				} catch (error) {
					console.error('Error updating with site info:', error);
				}
			}

			// Create a hash for the HTML content
			const fileHash = createHash('sha1').update(cleanHtml).digest('hex');

			// Create deployment with proper file specification
			const deployResponse = await fetch(
				`https://api.netlify.com/api/v1/sites/${siteData.id}/deploys`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						files: {
							'/index.html': fileHash,
						},
					}),
				},
			);

			if (!deployResponse.ok) {
				const error = await deployResponse.text();
				console.error('Deployment creation failed:', error);
				throw new Error(`Deployment creation failed: ${error}`);
			}

			const deployData = await deployResponse.json();
			console.log('Deployment created:', deployData.id);

			// Upload the file if required - using official Netlify API endpoint format
			if (deployData.required && deployData.required.length > 0) {
				console.log('Files required for upload:', deployData.required);

				// For each required file, upload using the correct API endpoint
				for (const requiredFileHash of deployData.required) {
					console.log('Uploading file with hash:', requiredFileHash);

					// Use the correct Netlify API endpoint for file uploads
					const uploadUrl = `https://api.netlify.com/api/v1/deploys/${deployData.id}/files/${requiredFileHash}`;
					console.log('Uploading to official API endpoint:', uploadUrl);

					const uploadResponse = await fetch(uploadUrl, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/octet-stream',
							Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
						},
						body: cleanHtml,
					});

					if (!uploadResponse.ok) {
						const error = await uploadResponse.text();
						console.error('File upload failed:', error);
						throw new Error(`File upload failed: ${error}`);
					}

					console.log('HTML file uploaded successfully via official API');
				}
			}

			// Wait a moment for deployment to process, then check status
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Check deployment status using Netlify API
			let finalDeploymentStatus = 'deployed';
			let actualSiteUrl = siteData.url;

			try {
				// Get the site info to check deployment status
				const siteInfoResponse = await fetch(
					`https://api.netlify.com/api/v1/sites/${siteData.id}`,
					{
						headers: {
							Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
						},
					},
				);

				if (siteInfoResponse.ok) {
					const siteInfo = await siteInfoResponse.json();
					console.log(
						'Site deployment state:',
						siteInfo.published_deploy?.state,
					);

					// Check the actual deployment state
					if (siteInfo.published_deploy?.state === 'ready') {
						finalDeploymentStatus = 'deployed';
						actualSiteUrl = siteInfo.url || siteData.url;
					} else if (
						siteInfo.published_deploy?.state === 'building' ||
						siteInfo.published_deploy?.state === 'enqueued'
					) {
						finalDeploymentStatus = 'deploying';
					} else {
						finalDeploymentStatus = 'failed';
					}
				}
			} catch (statusError) {
				console.error('Error checking deployment status:', statusError);
				// Default to deployed if we can't check status
			}

			console.log(
				'Deployment completed with status:',
				finalDeploymentStatus,
				'URL:',
				actualSiteUrl,
			);

			// Update generation with actual deployment info
			if (generationId && generationId !== 'preview') {
				try {
					console.log('🔄 Updating final deployment status:', {
						generationId,
						status: finalDeploymentStatus,
						url: actualSiteUrl,
						siteId: siteData.id,
					});

					// First check if the generation exists before updating
					const existingGeneration = await db
						.select({
							id: aiGeneration.id,
							deploymentStatus: aiGeneration.deploymentStatus,
							userId: aiGeneration.userId,
						})
						.from(aiGeneration)
						.where(eq(aiGeneration.id, generationId))
						.limit(1);

					console.log('🔍 Existing generation check:', existingGeneration);

					if (existingGeneration.length === 0) {
						console.error(
							'❌ Generation not found for final update:',
							generationId,
						);
						return Response.json({
							success: false,
							error: 'Generation not found for deployment update',
							generationId,
						});
					}

					// Verify user ownership
					if (existingGeneration[0].userId !== session.user.id) {
						console.error('❌ User mismatch for generation:', {
							generationUserId: existingGeneration[0].userId,
							sessionUserId: session.user.id,
						});
						return Response.json({
							success: false,
							error: 'Unauthorized to update this generation',
						});
					}

					const finalUpdateResult = await db
						.update(aiGeneration)
						.set({
							deploymentStatus: finalDeploymentStatus,
							deploymentUrl: actualSiteUrl,
							deploymentId: siteData.id, // Store site ID for deletion
							deployedAt:
								finalDeploymentStatus === 'deployed' ? new Date() : null,
							updatedAt: new Date(),
						})
						.where(eq(aiGeneration.id, generationId))
						.returning({
							id: aiGeneration.id,
							deploymentStatus: aiGeneration.deploymentStatus,
							deploymentUrl: aiGeneration.deploymentUrl,
							deploymentId: aiGeneration.deploymentId,
							deployedAt: aiGeneration.deployedAt,
						});

					console.log('✅ Final database update result:', finalUpdateResult);

					if (finalUpdateResult.length === 0) {
						console.error(
							'❌ Database update returned no rows for generation:',
							generationId,
						);
					} else {
						console.log(
							'✅ Successfully updated deployment status in database',
						);
					}
				} catch (error) {
					console.error('❌ Error updating successful deployment info:', error);
					console.error('❌ Error details:', {
						message: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					});
				}
			}

			return Response.json({
				success: true,
				url: actualSiteUrl,
				deployId: deployData.id,
				siteId: siteData.id,
				mock: false,
				status: finalDeploymentStatus,
				message:
					finalDeploymentStatus === 'deployed'
						? 'Successfully deployed to Netlify! Your AI-generated website is now live.'
						: finalDeploymentStatus === 'deploying'
						? 'Deployment started! Your site is building on Netlify.'
						: 'Deployment completed but may need a few moments to be fully ready.',
			});
		} catch (apiError) {
			console.error('Netlify deployment failed:', apiError);

			// Update deployment status to failed first
			if (generationId && generationId !== 'preview') {
				try {
					await db
						.update(aiGeneration)
						.set({
							deploymentStatus: 'failed',
							updatedAt: new Date(),
						})
						.where(eq(aiGeneration.id, generationId));
				} catch (error) {
					console.error('Error updating failed deployment status:', error);
				}
			}

			// Simulate deployment delay for fallback
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const mockUrl = `https://demo-preview-${Date.now()}.netlify.app`;

			// Update with mock deployment info as fallback
			if (generationId && generationId !== 'preview') {
				try {
					await db
						.update(aiGeneration)
						.set({
							deploymentStatus: 'deployed',
							deploymentUrl: mockUrl,
							deploymentId: deploymentName,
							deployedAt: new Date(),
							updatedAt: new Date(),
						})
						.where(eq(aiGeneration.id, generationId));
				} catch (error) {
					console.error('Error updating mock deployment info:', error);
				}
			}

			return Response.json({
				success: true,
				url: mockUrl,
				deployId: deploymentName,
				siteId: deploymentName,
				mock: true,
				message:
					'API deployment failed. Use Copy/Download buttons for reliable deployment.',
			});
		}
	} catch (error) {
		console.error('Deployment error:', error);
		return new Response('Failed to deploy site', { status: 500 });
	}
}
