'use client';

import { useState } from 'react';

interface HtmlEditorProps {
	htmlContent: string;
	generationId: string;
	onSave: (htmlContent: string) => void;
	onClose: () => void;
	onHtmlChange?: (htmlContent: string) => void;
}

export function HtmlEditor({
	htmlContent,
	generationId,
	onSave,
	onClose,
	onHtmlChange,
}: HtmlEditorProps) {
	const [editedHtml, setEditedHtml] = useState(htmlContent);
	const [isSaving, setIsSaving] = useState(false);

	const handleHtmlChange = (newHtml: string) => {
		setEditedHtml(newHtml);
		if (onHtmlChange) {
			onHtmlChange(newHtml);
		}
	};

	const handleDownload = () => {
		const blob = new Blob([editedHtml], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `website-${generationId}-${Date.now()}.html`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleSave = async () => {
		if (generationId === 'preview') {
			onSave(editedHtml);
			return;
		}

		setIsSaving(true);
		try {
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
				onSave(editedHtml);
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

	return (
		<div className='h-full flex flex-col bg-background border rounded-lg overflow-hidden'>
			{/* Editor Header */}
			<div className='flex items-center justify-between p-3 border-b bg-orange-100 dark:bg-orange-900/30'>
				<h3 className='text-sm font-semibold text-orange-800 dark:text-orange-200'>
					HTML Editor
				</h3>
				<div className='flex gap-2'>
					<button
						onClick={handleDownload}
						className='px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 text-xs rounded-md transition-colors'
					>
						📥 Download
					</button>
					<button
						onClick={handleSave}
						disabled={isSaving}
						className='px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 text-xs rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{isSaving ? 'Saving...' : '💾 Save & Preview'}
					</button>
					<button
						onClick={onClose}
						className='px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 text-xs rounded-md transition-colors'
					>
						✕ Close
					</button>
				</div>
			</div>
			{/* Text Editor */}
			<textarea
				value={editedHtml}
				onChange={(e) => handleHtmlChange(e.target.value)}
				className='flex-1 w-full p-4 font-mono text-sm border-0 resize-none focus:outline-none bg-background text-foreground'
				placeholder='Enter your HTML code here...'
				spellCheck={false}
			/>
		</div>
	);
}
