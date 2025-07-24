'use client';

interface LivePreviewProps {
	htmlContent: string;
	generationId: string;
}

export function LivePreview({ htmlContent, generationId }: LivePreviewProps) {
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

	return (
		<div className='h-full flex flex-col'>
			{generationId !== 'preview' && (
				<div className='border-b p-3'>
					<h3 className='font-medium text-gray-700'>Live Preview</h3>
				</div>
			)}
			<div className='flex-1 bg-gray-50 overflow-hidden flex flex-col'>
				<div className='flex-1 p-4'>
					<iframe
						srcDoc={extractedHtml}
						className='w-full h-full border rounded'
						title={`Preview of generation ${generationId}`}
						sandbox='allow-scripts allow-same-origin'
						style={{
							backgroundColor: 'white',
						}}
					/>
				</div>
				{generationId !== 'preview' && (
					<div className='bg-gray-100 px-3 py-2 border-t'>
						<div className='flex justify-between items-center text-sm text-gray-600'>
							<span>Interactive preview with Bootstrap styling</span>
							<button
								onClick={() => {
									const newWindow = window.open();
									if (newWindow) {
										newWindow.document.write(extractedHtml);
										newWindow.document.close();
									}
								}}
								className='text-blue-600 hover:text-blue-800 underline'
							>
								Open in new window
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
