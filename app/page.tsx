'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/lib/auth-client';
import { AuthButton } from '@/components/auth-button';
import { LivePreview } from '@/components/live-preview';
import { AIMessage } from '@/components/ai-message';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function ChatComponent() {
	const [input, setInput] = useState('');
	const router = useRouter();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Get conversation ID from URL
	const [conversationId, setConversationId] = useState<string | null>(null);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		setConversationId(urlParams.get('c'));
	}, []);

	const [messages, setMessages] = useState<any[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [currentGenerationId, setCurrentGenerationId] =
		useState<string>('preview');
	const [isGenerationComplete, setIsGenerationComplete] = useState(false);

	// Scroll to bottom when messages change
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Custom message sending function that handles conversations
	const sendMessage = async (input: { text: string }) => {
		if (isGenerating) return;

		setIsGenerating(true);
		setIsGenerationComplete(false);
		setCurrentGenerationId('preview');

		// Add user message immediately
		const userMessage = {
			id: Date.now().toString(),
			role: 'user',
			parts: [{ type: 'text', text: input.text }],
		};

		setMessages((prev) => [...prev, userMessage]);

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					messages: [...messages, userMessage],
					conversationId: conversationId || undefined,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Check for new conversation ID in response headers
			const newConversationId = response.headers.get('X-Conversation-ID');
			const newGenerationId = response.headers.get('X-Generation-ID');

			if (newConversationId && !conversationId) {
				router.push(`/?c=${newConversationId}`, { scroll: false });
			}

			if (newGenerationId) {
				setCurrentGenerationId(newGenerationId);
			}

			// Handle streaming response
			const reader = response.body?.getReader();
			let fullResponse = '';

			// Create AI message with empty text
			const aiMessage = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				parts: [{ type: 'text', text: '' }],
			};

			// Add empty AI message to show streaming
			setMessages((prev) => [...prev, aiMessage]);

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = new TextDecoder().decode(value);

					const lines = chunk.split('\n');

					for (const line of lines) {
						if (line.startsWith('data: ') && line !== 'data: [DONE]') {
							try {
								const data = JSON.parse(line.slice(6));
								if (data.type === 'text' && data.text) {
									fullResponse += data.text;

									// Update the AI message in real-time
									setMessages((prev) =>
										prev.map((msg) =>
											msg.id === aiMessage.id
												? {
														...msg,
														parts: [{ type: 'text', text: fullResponse }],
												  }
												: msg,
										),
									);
								}
							} catch (e) {
								// Ignore parse errors
							}
						}
					}
				}
			}

			// Mark generation as complete
			setIsGenerationComplete(true);
		} catch (error) {
			console.error('Error sending message:', error);
			// Add error message
			const errorMessage = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				parts: [
					{
						type: 'text',
						text: 'Sorry, there was an error generating your website. Please try again.',
					},
				],
			};
			setMessages((prev) => [...prev, errorMessage]);
		}

		setIsGenerating(false);
	};

	const { data: session, isPending } = useSession();
	const [conversationTitle, setConversationTitle] = useState('');

	// Load conversation details if we have a conversation ID
	useEffect(() => {
		if (conversationId && session?.user) {
			fetch(`/api/conversations/${conversationId}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.title) {
						setConversationTitle(data.title);
					}
				})
				.catch(console.error);
		} else if (!conversationId) {
			// Clear title when no conversation ID
			setConversationTitle('');
		}
	}, [conversationId, session]);

	// Extract the most recent AI response for preview
	const getLatestAIResponse = () => {
		const aiMessages = messages.filter((m: any) => m.role === 'assistant');
		if (aiMessages.length === 0) return '';

		const latestMessage = aiMessages[aiMessages.length - 1];

		return latestMessage.parts
			.filter((part: any) => part.type === 'text')
			.map((part: any) => part.text)
			.join('');
	};

	const latestAIResponse = getLatestAIResponse();

	const handleNewConversation = () => {
		setConversationTitle('');
		setMessages([]);
		setConversationId(null);
		setCurrentGenerationId('preview');
		setIsGenerationComplete(false);
		router.push('/');
	};

	return (
		<div className='h-screen bg-background flex flex-col overflow-hidden relative'>
			{/* Animated Background - Full animation for welcome page, subtle when logged in */}
			<div className='absolute inset-0 overflow-hidden pointer-events-none'>
				{!session?.user ? (
					// Full animation for welcome/login page
					<>
						{/* Primary breathing circles */}
						<div className='absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full animate-breathe opacity-80'></div>
						<div
							className='absolute top-40 right-32 w-80 h-80 bg-gradient-to-r from-pink-500/30 to-orange-500/30 rounded-full animate-breathe opacity-70'
							style={{ animationDelay: '1s' }}
						></div>
						<div
							className='absolute bottom-32 left-40 w-72 h-72 bg-gradient-to-r from-green-500/30 to-blue-500/30 rounded-full animate-breathe opacity-60'
							style={{ animationDelay: '2s' }}
						></div>
						<div
							className='absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full animate-breathe opacity-75'
							style={{ animationDelay: '0.5s' }}
						></div>

						{/* Secondary floating orbs */}
						<div
							className='absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-br from-cyan-400/35 to-blue-600/35 rounded-full animate-float opacity-50'
							style={{ animationDelay: '1.5s' }}
						></div>
						<div
							className='absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-br from-violet-400/35 to-purple-600/35 rounded-full animate-float opacity-55'
							style={{ animationDelay: '2.5s' }}
						></div>
						<div
							className='absolute top-1/2 left-1/4 w-40 h-40 bg-gradient-to-br from-emerald-400/32 to-teal-600/32 rounded-full animate-float opacity-45'
							style={{ animationDelay: '3s' }}
						></div>

						{/* Glowing particles */}
						<div
							className='absolute top-1/3 right-1/3 w-6 h-6 bg-blue-400/50 rounded-full animate-glow'
							style={{ animationDelay: '1s' }}
						></div>
						<div
							className='absolute bottom-1/3 left-1/5 w-4 h-4 bg-purple-400/50 rounded-full animate-glow'
							style={{ animationDelay: '2s' }}
						></div>
						<div
							className='absolute top-2/3 right-1/5 w-8 h-8 bg-pink-400/50 rounded-full animate-glow'
							style={{ animationDelay: '0.5s' }}
						></div>
						<div
							className='absolute top-1/5 left-2/3 w-3 h-3 bg-cyan-400/55 rounded-full animate-glow'
							style={{ animationDelay: '3.5s' }}
						></div>

						{/* Additional ambient orbs */}
						<div
							className='absolute top-1/6 right-2/3 w-20 h-20 bg-gradient-to-r from-indigo-400/25 to-cyan-400/25 rounded-full animate-pulse opacity-60'
							style={{ animationDuration: '8s' }}
						></div>
						<div
							className='absolute bottom-1/6 left-3/4 w-16 h-16 bg-gradient-to-r from-rose-400/25 to-orange-400/25 rounded-full animate-pulse opacity-55'
							style={{ animationDuration: '6s', animationDelay: '4s' }}
						></div>
					</>
				) : (
					// Subtle animation when logged in
					<>
						{/* Primary breathing circles - Very subtle */}
						<div className='absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/8 to-purple-500/8 rounded-full animate-breathe opacity-20'></div>
						<div
							className='absolute top-40 right-32 w-80 h-80 bg-gradient-to-r from-pink-500/8 to-orange-500/8 rounded-full animate-breathe opacity-15'
							style={{ animationDelay: '1s' }}
						></div>
						<div
							className='absolute bottom-32 left-40 w-72 h-72 bg-gradient-to-r from-green-500/8 to-blue-500/8 rounded-full animate-breathe opacity-12'
							style={{ animationDelay: '2s' }}
						></div>
						<div
							className='absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-r from-purple-500/8 to-pink-500/8 rounded-full animate-breathe opacity-18'
							style={{ animationDelay: '0.5s' }}
						></div>

						{/* Secondary floating orbs - Minimal presence */}
						<div
							className='absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-br from-cyan-400/6 to-blue-600/6 rounded-full animate-float opacity-10'
							style={{ animationDelay: '1.5s' }}
						></div>
						<div
							className='absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-br from-violet-400/6 to-purple-600/6 rounded-full animate-float opacity-12'
							style={{ animationDelay: '2.5s' }}
						></div>
						<div
							className='absolute top-1/2 left-1/4 w-40 h-40 bg-gradient-to-br from-emerald-400/6 to-teal-600/6 rounded-full animate-float opacity-8'
							style={{ animationDelay: '3s' }}
						></div>
					</>
				)}
			</div>

			{/* Fixed Header */}
			<header className='flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm flex-shrink-0 z-10 relative'>
				<div className='flex items-center gap-4'>
					<div className='flex items-center gap-2'>
						<img src='/globe.svg' alt='SiteGen Logo' className='w-6 h-6' />
						<h1 className='text-xl font-bold'>
							{conversationTitle || 'SiteGen'}
						</h1>
					</div>
					{conversationId && (
						<button
							onClick={handleNewConversation}
							className='text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90'
						>
							New Conversation
						</button>
					)}
				</div>
				<div className='flex items-center gap-3'>
					<ThemeToggle />
					{session?.user && (
						<span className='text-sm font-medium text-foreground'>
							{session.user.name}
						</span>
					)}
					<AuthButton />
				</div>
			</header>

			{/* Main Content - Take up remaining viewport height */}
			<main className='flex-1 overflow-hidden relative z-10'>
				{isPending ? (
					<div className='flex items-center justify-center h-full bg-background/20'>
						<div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
					</div>
				) : !session?.user ? (
					<div className='flex flex-col items-center justify-center h-full text-center bg-background/40'>
						<div className='flex items-center gap-3 mb-4'>
							<img src='/globe.svg' alt='SiteGen Logo' className='w-8 h-8' />
							<h2 className='text-2xl font-bold'>Welcome to SiteGen</h2>
						</div>
						<p className='mb-8 text-muted-foreground'>
							Sign in with GitHub to start generating websites with AI
						</p>
						<AuthButton />
					</div>
				) : (
					<div className='flex h-full bg-background/15'>
						{/* Left Side - Chat Interface */}
						<div className='flex flex-col w-1/2 border-r h-full bg-background/25'>
							{/* Chat Header */}
							<div className='p-3 border-b bg-muted/15 flex-shrink-0'>
								<p className='text-sm text-muted-foreground'>
									Welcome back, <strong>{session.user.name}</strong>!
									{conversationId
										? ' Continue editing your website.'
										: ' Describe the website you want to create.'}
								</p>
							</div>

							{/* Messages Container - Scrollable independently */}
							<div className='flex-1 overflow-hidden'>
								<div className='h-full overflow-y-auto p-4 space-y-4 scroll-smooth'>
									{messages.length === 0 ? (
										<div className='flex items-center justify-center h-full text-center min-h-[400px]'>
											<div>
												<h3 className='text-lg font-semibold mb-2'>
													{conversationId
														? 'Continue Editing'
														: 'Start Creating!'}
												</h3>
												<p className='text-muted-foreground text-sm'>
													{conversationId
														? 'Make changes to your website by describing what you want to modify.'
														: "Describe the website you want to build and I'll generate the HTML for you."}
												</p>
												<p className='text-muted-foreground text-xs mt-2'>
													Example:{' '}
													{conversationId
														? '"Change the main headline to say Your Next Gaming Adventure"'
														: '"Create a landing page for my restaurant with a menu section"'}
												</p>
											</div>
										</div>
									) : (
										<>
											{messages.map((message) => (
												<div
													key={message.id}
													className={`flex ${
														message.role === 'user'
															? 'justify-end'
															: 'justify-start'
													}`}
												>
													{message.role === 'user' ? (
														<div className='bg-primary text-primary-foreground max-w-[80%] px-4 py-2 rounded-lg'>
															{message.parts.map((part: any, i: number) => {
																if (part.type === 'text') {
																	return (
																		<div
																			key={`${message.id}-${i}`}
																			className='whitespace-pre-wrap text-sm'
																		>
																			{part.text}
																		</div>
																	);
																}
															})}
														</div>
													) : (
														<AIMessage
															text={message.parts
																.filter((part: any) => part.type === 'text')
																.map((part: any) => part.text)
																.join('')}
														/>
													)}
												</div>
											))}
											<div ref={messagesEndRef} />
											{/* Add some bottom padding to ensure last message is visible above input */}
											<div className='h-4'></div>
										</>
									)}
								</div>
							</div>

							{/* Fixed Input Form - Always visible at bottom */}
							<div className='flex-shrink-0 border-t bg-background/85 backdrop-blur-sm'>
								<form
									onSubmit={(e) => {
										e.preventDefault();
										if (!input.trim() || isGenerating) return;
										sendMessage({ text: input });
										setInput('');
									}}
									className='p-4'
								>
									<div className='flex space-x-2'>
										<input
											className='flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
											value={input}
											placeholder={
												conversationId
													? 'Describe what you want to change...'
													: 'Describe the website you want to create...'
											}
											onChange={(e) => setInput(e.currentTarget.value)}
											disabled={isGenerating}
										/>
										<button
											type='submit'
											disabled={!input.trim() || isGenerating}
											className='px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium'
										>
											{isGenerating
												? '...'
												: conversationId
												? 'Edit'
												: 'Generate'}
										</button>
									</div>
								</form>
							</div>
						</div>

						{/* Right Side - Live Preview with Full Height */}
						<div className='flex flex-col w-1/2 h-full bg-background/25'>
							{/* Preview Header */}
							<div className='p-3 border-b bg-muted/15 flex-shrink-0'>
								<h2 className='text-sm font-semibold'>Live Preview</h2>
								<p className='text-xs text-muted-foreground'>
									Your generated website will appear here
								</p>
							</div>

							{/* Preview Content - Full remaining height */}
							<div className='flex-1 overflow-hidden'>
								{latestAIResponse ? (
									<LivePreview
										htmlContent={latestAIResponse}
										generationId={currentGenerationId}
										isGenerationComplete={isGenerationComplete}
										isGenerating={isGenerating}
									/>
								) : (
									<div className='flex items-center justify-center h-full text-center p-8'>
										<div>
											<div className='w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center'>
												<svg
													className='w-8 h-8 text-muted-foreground'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
													/>
												</svg>
											</div>
											<h3 className='text-lg font-semibold mb-2'>
												{conversationId
													? 'Loading Website...'
													: 'No Website Generated Yet'}
											</h3>
											<p className='text-muted-foreground text-sm'>
												{conversationId
													? 'Your website will appear here once loaded'
													: 'Start a conversation to generate your first website'}
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

export default function Chat() {
	return (
		<Suspense
			fallback={
				<div className='flex items-center justify-center min-h-screen'>
					<div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
				</div>
			}
		>
			<ChatComponent />
		</Suspense>
	);
}
