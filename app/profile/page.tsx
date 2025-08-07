'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/user-avatar';
import { HtmlEditor } from '@/components/html-editor';
import {
	ArrowLeft,
	Eye,
	Download,
	Calendar,
	Clock,
	ExternalLink,
	Globe,
	Trash,
	Rocket,
} from 'lucide-react';

interface AiGeneration {
	id: string;
	userPrompt: string;
	aiResponse: string;
	status: string;
	createdAt: string;
	model: string;
	version: number;
	isCurrentVersion: boolean;
	deploymentStatus?: string | null;
	deploymentUrl?: string | null;
	deploymentId?: string | null;
	deployedAt?: string | null;
}

interface PreviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	htmlContent: string;
	generationId: string;
	onContentUpdated?: (generationId: string, newContent: string) => void;
}

function PreviewModal({
	isOpen,
	onClose,
	htmlContent,
	generationId,
	onContentUpdated,
}: PreviewModalProps) {
	const [isEditMode, setIsEditMode] = useState(false);
	const [editedHtml, setEditedHtml] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	// Extract HTML content from markdown code blocks if present
	const extractHtml = (content: string) => {
		const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/);
		if (htmlMatch) {
			return htmlMatch[1].trim();
		}
		const generalMatch = content.match(/```\s*([\s\S]*?)\s*```/);
		if (generalMatch) {
			return generalMatch[1].trim();
		}
		return content.trim();
	};

	// Process the HTML content to extract actual HTML
	const processedHtmlContent = extractHtml(htmlContent);

	// Initialize editedHtml when the modal opens or htmlContent changes
	useEffect(() => {
		if (isOpen && processedHtmlContent) {
			setEditedHtml(processedHtmlContent);
			setIsEditMode(false); // Reset edit mode when switching between generations
		}
	}, [isOpen, processedHtmlContent]);

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setEditedHtml('');
			setIsEditMode(false);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const handleDownload = () => {
		const htmlToDownload = editedHtml || processedHtmlContent;
		const blob = new Blob([htmlToDownload], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `website-${generationId}.html`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleEditHTML = () => {
		setIsEditMode(true);
	};

	const handleSaveAndPreview = async (newHtml: string) => {
		setIsSaving(true);
		try {
			// Save to database
			const response = await fetch('/api/generations/update-html', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					generationId: generationId,
					htmlContent: newHtml,
				}),
			});

			if (response.ok) {
				setEditedHtml(newHtml);
				setIsEditMode(false);
				// Notify parent component of the content update
				if (onContentUpdated) {
					onContentUpdated(generationId, newHtml);
				}
			} else {
				console.error('Failed to save HTML:', response.status);
				alert('Failed to save HTML. Please try again.');
			}
		} catch (error) {
			console.error('Error saving HTML:', error);
			alert('Error saving HTML. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleCloseEdit = () => {
		setIsEditMode(false);
		setEditedHtml('');
	};

	return (
		<div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
			<div className='bg-background border rounded-lg w-full max-w-7xl h-[85vh] flex flex-col'>
				<div className='flex items-center justify-between p-4 border-b'>
					<h3 className='text-lg font-semibold'>
						{isEditMode ? 'HTML Editor & Preview' : 'Website Preview'}
					</h3>
					<div className='flex items-center gap-2'>
						{isEditMode ? (
							<>
								<Button variant='outline' size='sm' onClick={handleCloseEdit}>
									✕ Close Editor
								</Button>
							</>
						) : (
							<>
								<Button variant='outline' size='sm' onClick={handleDownload}>
									<Download className='h-4 w-4 mr-2' />
									Download
								</Button>
								<Button variant='outline' size='sm' onClick={handleEditHTML}>
									✏️ Edit HTML
								</Button>
								<Button variant='outline' size='sm' onClick={onClose}>
									Close
								</Button>
							</>
						)}
					</div>
				</div>
				<div className='flex-1 overflow-hidden flex'>
					{isEditMode ? (
						<>
							{/* Left side - HTML Editor */}
							<div className='w-1/2 border-r'>
								<HtmlEditor
									htmlContent={editedHtml}
									generationId={generationId}
									onSave={handleSaveAndPreview}
									onClose={handleCloseEdit}
									onHtmlChange={setEditedHtml}
								/>
							</div>
							{/* Right side - Live Preview */}
							<div className='w-1/2 flex flex-col'>
								<div className='p-3 border-b bg-muted/15 flex-shrink-0'>
									<h4 className='text-sm font-semibold'>Live Preview</h4>
									<p className='text-xs text-muted-foreground'>
										Changes appear here as you edit
									</p>
								</div>
								<div className='flex-1 overflow-hidden'>
									<iframe
										srcDoc={editedHtml}
										className='w-full h-full border-0'
										title='Website Preview'
										sandbox='allow-scripts allow-same-origin'
									/>
								</div>
							</div>
						</>
					) : (
						<iframe
							srcDoc={editedHtml || processedHtmlContent}
							className='w-full h-full border-0'
							title='Website Preview'
							sandbox='allow-scripts allow-same-origin'
						/>
					)}
				</div>
			</div>
		</div>
	);
}

export default function ProfilePage() {
	const router = useRouter();
	const { data: session, isPending } = useSession();
	const [generations, setGenerations] = useState<AiGeneration[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedGeneration, setSelectedGeneration] =
		useState<AiGeneration | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deployingId, setDeployingId] = useState<string | null>(null);

	// Check authentication
	useEffect(() => {
		if (!isPending && !session) {
			router.push('/');
		}
	}, [session, isPending, router]);

	// Fetch user's AI generations
	useEffect(() => {
		if (session?.user) {
			fetchGenerations();
		}
	}, [session]);

	const fetchGenerations = async () => {
		try {
			console.log('🔄 Fetching generations from API...');
			const response = await fetch('/api/profile/generations');
			if (response.ok) {
				const data = await response.json();
				console.log('📊 Fetched generations:', data.length, 'items');
				setGenerations(data);
			} else {
				console.error('❌ Failed to fetch generations:', response.status);
			}
		} catch (error) {
			console.error('❌ Error fetching generations:', error);
		} finally {
			setLoading(false);
		}
	};

	const handlePreview = (generation: AiGeneration) => {
		setSelectedGeneration(generation);
	};

	const handleContentUpdated = (generationId: string, newContent: string) => {
		// Update the generations state with the new content
		setGenerations((prev) =>
			prev.map((generation) =>
				generation.id === generationId
					? { ...generation, aiResponse: `\`\`\`html\n${newContent}\n\`\`\`` }
					: generation,
			),
		);

		// Update the selected generation if it's the one being edited
		if (selectedGeneration?.id === generationId) {
			setSelectedGeneration((prev) =>
				prev
					? { ...prev, aiResponse: `\`\`\`html\n${newContent}\n\`\`\`` }
					: null,
			);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const formatTime = (dateString: string) => {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const handleDelete = async (
		generationId: string,
		deploymentStatus?: string | null,
	) => {
		if (
			!confirm(
				deploymentStatus === 'deployed' || deploymentStatus === 'deploying'
					? 'This will delete the website from Netlify and change status to not deployed. Continue?'
					: 'This will permanently delete this generation. Continue?',
			)
		) {
			return;
		}

		setDeletingId(generationId);
		try {
			const response = await fetch('/api/deploy/delete', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ generationId }),
			});

			if (!response.ok) {
				throw new Error('Failed to delete');
			}

			const result = await response.json();

			if (result.action === 'generation_deleted') {
				// Remove from list entirely
				setGenerations((prev) => prev.filter((g) => g.id !== generationId));
			} else {
				// Update the status to not_deployed
				setGenerations((prev) =>
					prev.map((g) =>
						g.id === generationId
							? {
									...g,
									deploymentStatus: 'not_deployed',
									deploymentUrl: null,
									deploymentId: null,
									deployedAt: null,
							  }
							: g,
					),
				);
			}
		} catch (error) {
			console.error('Delete error:', error);
			alert('Failed to delete. Please try again.');
		} finally {
			setDeletingId(null);
		}
	};

	const handleDeploy = async (generation: AiGeneration) => {
		if (!generation.aiResponse) {
			alert('No content to deploy');
			return;
		}

		setDeployingId(generation.id);

		try {
			// Extract HTML content from the AI response (same logic as live preview)
			const extractHtml = (content: string) => {
				const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/);
				if (htmlMatch) {
					return htmlMatch[1].trim();
				}
				const generalMatch = content.match(/```\s*([\s\S]*?)\s*```/);
				if (generalMatch) {
					return generalMatch[1].trim();
				}
				return content.trim();
			};

			const extractedHtml = extractHtml(generation.aiResponse);

			console.log('🚀 Starting deployment for generation:', generation.id);

			const response = await fetch('/api/deploy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					htmlContent: extractedHtml,
					siteName: `ai-website-${Date.now()}`,
					generationId: generation.id,
				}),
			});

			console.log('📡 Deploy API response status:', response.status);

			if (!response.ok) {
				throw new Error('Failed to deploy website');
			}

			const result = await response.json();
			console.log('📊 Deploy API result:', result);

			// Update the generation in the list with deployment info
			setGenerations((prev) =>
				prev.map((g) =>
					g.id === generation.id
						? {
								...g,
								deploymentStatus:
									result.status === 'deployed' ? 'deployed' : 'deploying',
								deploymentUrl: result.url,
								deploymentId: result.siteId,
								deployedAt:
									result.status === 'deployed'
										? new Date().toISOString()
										: null,
						  }
						: g,
				),
			);

			// Show success message
			alert(result.message || 'Deployment completed successfully!');
		} catch (error) {
			console.error('❌ Deployment error:', error);
			alert(
				error instanceof Error ? error.message : 'Failed to deploy website',
			);
		} finally {
			setDeployingId(null);
		}
	};

	const getDeploymentStatusInfo = (status?: string | null) => {
		switch (status) {
			case 'deployed':
				return {
					label: 'Deployed',
					variant: 'default' as const,
					color: 'bg-green-500',
				};
			case 'deploying':
				return {
					label: 'Deploying',
					variant: 'secondary' as const,
					color: 'bg-yellow-500',
				};
			case 'failed':
				return {
					label: 'Deploy Failed',
					variant: 'destructive' as const,
					color: 'bg-red-500',
				};
			default:
				return {
					label: 'Not Deployed',
					variant: 'outline' as const,
					color: 'bg-gray-500',
				};
		}
	};

	if (isPending || loading) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 max-w-6xl'>
				<div className='flex items-center gap-4 mb-8'>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => router.back()}
						className='flex items-center gap-2'
					>
						<ArrowLeft className='h-4 w-4' />
						Back
					</Button>
					<h1 className='text-2xl font-bold'>Profile</h1>
					<Button
						variant='outline'
						size='sm'
						onClick={fetchGenerations}
						disabled={loading}
						className='flex items-center gap-2 ml-auto'
					>
						Refresh
					</Button>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
					{/* User Info Section */}
					<div className='lg:col-span-1'>
						<div className='border rounded-lg p-6 sticky top-8'>
							<div className='text-center'>
								<UserAvatar
									name={session.user.name}
									image={session.user.image}
									className='h-20 w-20 mx-auto mb-4'
								/>
								<h2 className='text-xl font-semibold'>{session.user.name}</h2>
								<p className='text-muted-foreground text-sm'>
									{session.user.email}
								</p>
								<div className='flex items-center justify-center gap-2 mt-4'>
									<Badge
										variant={
											session.user.emailVerified ? 'default' : 'secondary'
										}
									>
										{session.user.emailVerified ? 'Verified' : 'Unverified'}
									</Badge>
								</div>
								<p className='text-xs text-muted-foreground mt-2'>
									Member since{' '}
									{new Date(session.user.createdAt).toLocaleDateString(
										'en-US',
										{
											year: 'numeric',
											month: 'short',
											day: 'numeric',
										},
									)}
								</p>
							</div>

							<div className='mt-6 pt-6 border-t'>
								<div className='flex justify-between items-center'>
									<span className='text-sm font-medium'>Total Generations</span>
									<span className='text-2xl font-bold text-primary'>
										{generations.length}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* History Section */}
					<div className='lg:col-span-2'>
						<div className='border rounded-lg'>
							<div className='p-6 border-b'>
								<h3 className='text-lg font-semibold'>Generation History</h3>
								<p className='text-sm text-muted-foreground'>
									View and manage your AI-generated websites
								</p>
							</div>

							<div className='divide-y'>
								{generations.length === 0 ? (
									<div className='p-8 text-center'>
										<div className='w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center'>
											<Eye className='w-8 h-8 text-muted-foreground' />
										</div>
										<h3 className='text-lg font-semibold mb-2'>
											No Generations Yet
										</h3>
										<p className='text-muted-foreground text-sm'>
											Start creating websites to see your history here
										</p>
									</div>
								) : (
									generations.map((generation) => (
										<div
											key={generation.id}
											className='p-4 hover:bg-muted/50 transition-colors'
										>
											<div className='flex items-start justify-between'>
												<div className='flex-1 min-w-0'>
													<div className='flex items-center gap-2 mb-2'>
														<Badge
															variant={
																generation.status === 'completed'
																	? 'default'
																	: 'secondary'
															}
														>
															{generation.status}
														</Badge>
														<Badge
															variant={
																getDeploymentStatusInfo(
																	generation.deploymentStatus,
																).variant
															}
														>
															<div
																className={`w-2 h-2 rounded-full mr-1 ${
																	getDeploymentStatusInfo(
																		generation.deploymentStatus,
																	).color
																}`}
															></div>
															{
																getDeploymentStatusInfo(
																	generation.deploymentStatus,
																).label
															}
														</Badge>
														<span className='text-xs text-muted-foreground'>
															ID: {generation.id.substring(0, 8)}...
														</span>
													</div>
													<p className='text-sm font-medium mb-2 line-clamp-2'>
														{(() => {
															try {
																// Try to parse the userPrompt as JSON first
																const parsed = JSON.parse(
																	generation.userPrompt,
																);
																if (Array.isArray(parsed)) {
																	// Find the first user message
																	const userMessage = parsed.find(
																		(msg: any) => msg.role === 'user',
																	);
																	if (userMessage?.parts?.[0]?.text) {
																		return `User Request: ${userMessage.parts[0].text}`;
																	}
																}
																// If it's already a simple string, use it as is
																return `User Request: ${generation.userPrompt}`;
															} catch {
																// If parsing fails, assume it's already a simple string
																return `User Request: ${generation.userPrompt}`;
															}
														})()}
													</p>
													<div className='flex items-center gap-4 text-xs text-muted-foreground'>
														<div className='flex items-center gap-1'>
															<Calendar className='h-3 w-3' />
															{formatDate(generation.createdAt)}
														</div>
														<div className='flex items-center gap-1'>
															<Clock className='h-3 w-3' />
															{formatTime(generation.createdAt)}
														</div>
														<span>v{generation.version}</span>
													</div>
												</div>
												<div className='ml-4 flex items-center gap-2'>
													{generation.deploymentUrl &&
														generation.deploymentStatus === 'deployed' && (
															<Button
																variant='ghost'
																size='sm'
																onClick={() =>
																	window.open(
																		generation.deploymentUrl!,
																		'_blank',
																	)
																}
																className='flex items-center gap-2'
															>
																<ExternalLink className='h-4 w-4' />
																Visit Site
															</Button>
														)}
													{/* Deploy Button - Show when not deployed and has content */}
													{generation.deploymentStatus !== 'deployed' &&
														generation.deploymentStatus !== 'deploying' &&
														generation.aiResponse && (
															<Button
																variant='outline'
																size='sm'
																onClick={() => handleDeploy(generation)}
																disabled={deployingId === generation.id}
																className='flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200'
															>
																{deployingId === generation.id ? (
																	<>
																		<div className='w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin' />
																		Deploying...
																	</>
																) : (
																	<>
																		<Rocket className='h-4 w-4' />
																		Deploy
																	</>
																)}
															</Button>
														)}
													<Button
														variant='outline'
														size='sm'
														onClick={() => handlePreview(generation)}
														className='flex items-center gap-2'
													>
														<Eye className='h-4 w-4' />
														Preview
													</Button>
													<Button
														variant='outline'
														size='sm'
														onClick={() =>
															handleDelete(
																generation.id,
																generation.deploymentStatus,
															)
														}
														disabled={deletingId === generation.id}
														className={`flex items-center gap-2 ${
															generation.deploymentStatus === 'deployed' ||
															generation.deploymentStatus === 'deploying'
																? 'text-red-600 hover:text-red-700 hover:bg-red-50'
																: 'text-gray-600 hover:text-gray-700'
														}`}
													>
														<Trash className='h-4 w-4' />
														{deletingId === generation.id
															? 'Deleting...'
															: generation.deploymentStatus === 'deployed' ||
															  generation.deploymentStatus === 'deploying'
															? 'Delete Website'
															: 'Delete'}
													</Button>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Preview Modal */}
			<PreviewModal
				isOpen={!!selectedGeneration}
				onClose={() => setSelectedGeneration(null)}
				htmlContent={selectedGeneration?.aiResponse || ''}
				generationId={selectedGeneration?.id || ''}
				onContentUpdated={handleContentUpdated}
			/>
		</div>
	);
}
