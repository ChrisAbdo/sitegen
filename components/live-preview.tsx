'use client';

import { useState } from 'react';

interface LivePreviewProps {
	htmlContent: string;
	generationId: string;
	isGenerationComplete?: boolean;
	isGenerating?: boolean;
	onHtmlUpdate?: (newHtml: string) => void;
	onExpandEditor?: (isExpanded: boolean) => void;
}

export function LivePreview({
	htmlContent,
	generationId,
	isGenerationComplete = false,
	isGenerating = false,
	onHtmlUpdate,
	onExpandEditor,
}: LivePreviewProps) {
	const [isDeploying, setIsDeploying] = useState(false);
	const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
	const [deployError, setDeployError] = useState<string | null>(null);
	const [deployMessage, setDeployMessage] = useState<string | null>(null);
	const [isMockDeployment, setIsMockDeployment] = useState(false);
	const [copied, setCopied] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [editedHtml, setEditedHtml] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	// Parse HTML from markdown code blocks
	const extractHtml = (content: string) => {
		// Remove ```html and ``` markers
		const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/);
		if (htmlMatch) {
			return htmlMatch[1].trim();
		}

		// Fallback: try to find any HTML content
		const generalMatch = content.match(/```\s*([\s\S]*?)\s*```/);
		if (generalMatch) {
			return generalMatch[1].trim();
		}

		// If no code blocks found, assume the entire content is HTML
		return content.trim();
	};

	const extractedHtml = extractHtml(htmlContent);

	const handleEditHTML = () => {
		setEditedHtml(extractedHtml);
		setIsEditMode(true);
		if (onExpandEditor) {
			onExpandEditor(true);
		}
	};

	const handleSaveAndPreview = async () => {
		if (generationId === 'preview') {
			// For preview mode, just switch back to preview
			setIsEditMode(false);
			if (onExpandEditor) {
				onExpandEditor(false);
			}
			return;
		}

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
					htmlContent: editedHtml,
				}),
			});

			if (response.ok) {
				// Update the parent component with new HTML
				if (onHtmlUpdate) {
					onHtmlUpdate(editedHtml);
				}
				setIsEditMode(false);
				if (onExpandEditor) {
					onExpandEditor(false);
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
		if (onExpandEditor) {
			onExpandEditor(false);
		}
	};

	const handleCopyHTML = async () => {
		const htmlToCopy = editedHtml || extractedHtml;
		try {
			await navigator.clipboard.writeText(htmlToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy HTML:', error);
			// Fallback: create a text area and select it
			const textArea = document.createElement('textarea');
			textArea.value = htmlToCopy;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleDownloadHTML = () => {
		const htmlToDownload = editedHtml || extractedHtml;
		const blob = new Blob([htmlToDownload], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `website-${generationId}-${Date.now()}.html`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleDeploy = async () => {
		setIsDeploying(true);
		setDeployError(null);
		setDeployedUrl(null);
		setDeployMessage(null);
		setIsMockDeployment(false);

		console.log('🚀 Starting deployment with generationId:', generationId);

		try {
			const response = await fetch('/api/deploy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					htmlContent: editedHtml || extractedHtml,
					siteName: `ai-website-${Date.now()}`,
					generationId: generationId,
				}),
			});

			console.log('📡 Deploy API response status:', response.status);

			if (!response.ok) {
				throw new Error('Failed to deploy website');
			}

			const result = await response.json();
			console.log('📊 Deploy API result:', result);

			setDeployedUrl(result.url);
			setDeployMessage(result.message || 'Deployment completed');
			setIsMockDeployment(result.mock || false);
		} catch (error) {
			console.error('❌ Deployment error:', error);
			setDeployError(
				error instanceof Error ? error.message : 'Failed to deploy',
			);
		} finally {
			setIsDeploying(false);
		}
	};

	return (
		<div className='h-full flex flex-col'>
			{/* Header with Deploy and Manual Options */}
			<div className='flex-shrink-0 border-b p-2 bg-background'>
				<div className='flex justify-between items-center mb-2'>
					<div>
						{generationId !== 'preview' && (
							<h3 className='font-medium text-gray-700 text-sm'>
								Live Preview
							</h3>
						)}
						{isGenerating && (
							<p className='text-xs text-gray-500'>
								🔄 Generating website... Deploy button will be enabled when
								complete.
							</p>
						)}
						{!isGenerating &&
							!isGenerationComplete &&
							generationId === 'preview' && (
								<p className='text-xs text-gray-500'>
									💡 Generate a website first to enable deployment.
								</p>
							)}
						{!isGenerating &&
							isGenerationComplete &&
							generationId !== 'preview' && (
								<p className='text-xs text-green-600'>
									✅ Website generated successfully! Deploy button is now
									active.
								</p>
							)}
					</div>
					<div className='flex gap-2'>
						<div className='relative group'>
							<button
								onClick={handleCopyHTML}
								className={`px-3 py-1 text-xs rounded-md transition-colors ${
									copied
										? 'bg-green-100 text-green-700 border border-green-300'
										: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300'
								}`}
							>
								{copied ? '✓ Copied!' : 'Copy HTML'}
							</button>
							<div className='absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-64 p-2 bg-blue-900 text-white text-xs rounded shadow-lg'>
								<div className='font-semibold mb-1'>🚀 Copy & Deploy:</div>
								<div>
									Go to netlify.com/drop → Create "index.html" → Paste → Drag
									file to deploy instantly!
								</div>
							</div>
						</div>
						<div className='relative group'>
							<button
								onClick={handleDownloadHTML}
								className='px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 text-xs rounded-md transition-colors'
							>
								📥 Download
							</button>
							<div className='absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-64 p-2 bg-purple-900 text-white text-xs rounded shadow-lg'>
								<div className='font-semibold mb-1'>🚀 Download & Deploy:</div>
								<div>
									Drag the downloaded file directly to netlify.com/drop for
									instant deployment!
								</div>
							</div>
						</div>
						<div className='relative group'>
							<button
								onClick={handleEditHTML}
								className='px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 text-xs rounded-md transition-colors'
							>
								✏️ Edit HTML
							</button>
							<div className='absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-64 p-2 bg-orange-900 text-white text-xs rounded shadow-lg'>
								<div className='font-semibold mb-1'>✏️ Edit HTML:</div>
								<div>
									Switch to text editor mode to modify the HTML code directly
									and save changes.
								</div>
							</div>
						</div>
						{deployedUrl && (
							<a
								href={deployedUrl}
								target='_blank'
								rel='noopener noreferrer'
								className={`px-2 py-1 text-white text-xs rounded transition-colors ${
									isMockDeployment
										? 'bg-yellow-600 hover:bg-yellow-700'
										: 'bg-green-600 hover:bg-green-700'
								}`}
							>
								{isMockDeployment ? 'Demo URL' : 'Visit Site'}
							</a>
						)}
						<button
							onClick={handleDeploy}
							disabled={
								isDeploying ||
								(!extractedHtml && !editedHtml) ||
								generationId === 'preview' ||
								!isGenerationComplete ||
								isGenerating
							}
							className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
								isDeploying ||
								(!extractedHtml && !editedHtml) ||
								generationId === 'preview' ||
								!isGenerationComplete ||
								isGenerating
									? 'bg-gray-400 text-gray-600 cursor-not-allowed'
									: 'bg-blue-600 text-white hover:bg-blue-700'
							}`}
						>
							{isDeploying ? (
								<>
									<div className='w-2 h-2 border border-white border-t-transparent rounded-full animate-spin' />
									Deploying...
								</>
							) : isGenerating ? (
								<>
									<div className='w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin' />
									Generating...
								</>
							) : generationId === 'preview' || !isGenerationComplete ? (
								'Deploy (Disabled)'
							) : (
								'Deploy'
							)}
						</button>
					</div>
				</div>
				{deployError && (
					<div className='mt-1 text-xs text-red-600 bg-red-50 p-1 rounded'>
						{deployError}
					</div>
				)}
				{deployedUrl && !deployError && (
					<div
						className={`mt-1 text-xs p-1 rounded ${
							isMockDeployment
								? 'text-yellow-700 bg-yellow-50 border border-yellow-200'
								: 'text-green-600 bg-green-50'
						}`}
					>
						{isMockDeployment ? '⚠️' : '✅'} {deployMessage}
						{isMockDeployment && (
							<div className='mt-1 text-xs text-yellow-600'>
								Note: This is a preview URL. The site is not actually deployed.
								To enable real deployments, add your Netlify access token to the
								environment variables.
							</div>
						)}
					</div>
				)}
				{deployMessage && !deployedUrl && !deployError && (
					<div className='mt-1 text-xs text-green-600 bg-green-50 p-1 rounded'>
						{deployMessage}
					</div>
				)}
			</div>

			{/* Preview Content - Maximum Space Usage */}
			<div className='flex-1 bg-muted/30 overflow-hidden'>
				<div className='h-full p-1'>
					<div className='h-full rounded border bg-background overflow-hidden'>
						<iframe
							key={`preview-${generationId}-${htmlContent.length}`}
							srcDoc={editedHtml || extractedHtml}
							className='w-full h-full border-0'
							title={`Preview of generation ${generationId}`}
							sandbox='allow-scripts allow-same-origin allow-forms'
							style={{
								backgroundColor: 'white',
								display: 'block',
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
