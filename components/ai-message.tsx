'use client';

import { useState, useRef, useEffect } from 'react';

interface AIMessageProps {
	text: string;
	maxLines?: number;
}

export function AIMessage({ text, maxLines = 5 }: AIMessageProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [shouldTruncate, setShouldTruncate] = useState(false);
	const textRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (textRef.current) {
			// Calculate if text overflows beyond maxLines
			const lineHeight = parseFloat(
				getComputedStyle(textRef.current).lineHeight,
			);
			const maxHeight = lineHeight * maxLines;
			const actualHeight = textRef.current.scrollHeight;

			setShouldTruncate(actualHeight > maxHeight);
		}
	}, [text, maxLines]);

	return (
		<div className='bg-muted max-w-[80%] px-4 py-2 rounded-lg'>
			<div
				ref={textRef}
				className={`whitespace-pre-wrap text-sm overflow-hidden ${
					shouldTruncate && !isExpanded ? `line-clamp-${maxLines}` : ''
				}`}
				style={{
					display: shouldTruncate && !isExpanded ? '-webkit-box' : 'block',
					WebkitLineClamp: shouldTruncate && !isExpanded ? maxLines : 'unset',
					WebkitBoxOrient: shouldTruncate && !isExpanded ? 'vertical' : 'unset',
				}}
			>
				{text}
			</div>
			{shouldTruncate && (
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className='mt-2 text-xs text-primary hover:text-primary/80 underline font-medium'
				>
					{isExpanded ? 'Collapse' : 'Expand All'}
				</button>
			)}
		</div>
	);
}
