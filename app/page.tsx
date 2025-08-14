'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from '@/lib/auth-client';
import { AuthButton } from '@/components/auth-button';
import { MultiAuthButton } from '@/components/multi-auth-button';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ConversationSidebar } from '@/components/conversation-sidebar';
import { LivePreview } from '@/components/live-preview';
import { HtmlEditor } from '@/components/html-editor';
import { AIMessage } from '@/components/ai-message';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

function ChatComponent() {
	const [input, setInput] = useState('');
	const router = useRouter();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Get conversation ID from URL
	const [conversationId, setConversationId] = useState<string | null>(null);

	// Add deployment trigger state
	const [triggerDeployment, setTriggerDeployment] = useState(0);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const urlConversationId = urlParams.get('c');
		if (urlConversationId !== conversationId) {
			setConversationId(urlConversationId);
		}
	}, []); // Initialize once

	// Listen for URL changes (e.g., when user clicks back/forward)
	useEffect(() => {
		const handlePopState = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const urlConversationId = urlParams.get('c');
			if (urlConversationId !== conversationId) {
				setConversationId(urlConversationId);
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, [conversationId]);

	const [messages, setMessages] = useState<any[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [currentGenerationId, setCurrentGenerationId] =
		useState<string>('preview');
	const [isGenerationComplete, setIsGenerationComplete] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

	// Resizable panels state
	const [sidebarWidth, setSidebarWidth] = useState(300); // sidebar width in pixels
	const [chatWidth, setChatWidth] = useState(50); // chat width as percentage of remaining space
	const [isDraggingChat, setIsDraggingChat] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// HTML Editor expansion state
	const [isEditorExpanded, setIsEditorExpanded] = useState(false);
	const [currentEditingHtml, setCurrentEditingHtml] = useState('');

	// Check if mobile viewport and set default sidebar state
	useEffect(() => {
		const checkMobile = () => {
			const isMobileScreen = window.innerWidth < 768; // md breakpoint
			setIsMobile(isMobileScreen);

			// Hide sidebar by default on mobile
			if (isMobileScreen && sidebarOpen) {
				setSidebarOpen(false);
			}
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Load saved panel sizes from localStorage
	useEffect(() => {
		const savedSidebarWidth = localStorage.getItem('sidebarWidth');
		const savedChatWidth = localStorage.getItem('chatWidth');
		if (savedSidebarWidth) {
			setSidebarWidth(parseInt(savedSidebarWidth));
		}
		if (savedChatWidth) {
			setChatWidth(parseInt(savedChatWidth));
		}
	}, []);

	// Save panel sizes to localStorage when they change
	useEffect(() => {
		localStorage.setItem('sidebarWidth', sidebarWidth.toString());
	}, [sidebarWidth]);

	useEffect(() => {
		localStorage.setItem('chatWidth', chatWidth.toString());
	}, [chatWidth]);

	// Scroll to bottom when messages change
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Mouse event handlers for resizing panels
	const handleChatMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsDraggingChat(true);
	};

	// Touch event handlers for mobile support
	const handleChatTouchStart = (e: React.TouchEvent) => {
		e.preventDefault();
		setIsDraggingChat(true);
	};

	useEffect(() => {
		const getClientX = (e: MouseEvent | TouchEvent): number => {
			return 'touches' in e ? e.touches[0].clientX : e.clientX;
		};

		const handleMove = (e: MouseEvent | TouchEvent) => {
			const clientX = getClientX(e);

			if (isDraggingChat) {
				const containerRect = document
					.querySelector('.resizable-container')
					?.getBoundingClientRect();
				if (containerRect) {
					// On mobile, sidebar doesn't affect layout since it overlays
					const sidebarSpace = !isMobile && sidebarOpen ? sidebarWidth + 4 : 0; // +4 for resize handle width
					const remainingWidth = containerRect.width - sidebarSpace;
					const relativeX = clientX - containerRect.left - sidebarSpace;
					const newChatWidth = Math.max(
						25,
						Math.min(75, (relativeX / remainingWidth) * 100),
					);
					setChatWidth(newChatWidth);
				}
			}
		};

		const handleEnd = () => {
			setIsDraggingChat(false);
		};

		if (isDraggingChat) {
			// Mouse events
			document.addEventListener('mousemove', handleMove);
			document.addEventListener('mouseup', handleEnd);
			// Touch events
			document.addEventListener('touchmove', handleMove, { passive: false });
			document.addEventListener('touchend', handleEnd);

			document.body.style.cursor = 'col-resize';
			document.body.style.userSelect = 'none';

			return () => {
				document.removeEventListener('mousemove', handleMove);
				document.removeEventListener('mouseup', handleEnd);
				document.removeEventListener('touchmove', handleMove);
				document.removeEventListener('touchend', handleEnd);
				document.body.style.cursor = 'default';
				document.body.style.userSelect = 'auto';
			};
		}
	}, [isDraggingChat, sidebarWidth, sidebarOpen, isMobile]);

	// Custom message sending function that handles conversations
	const sendMessage = async (input: { text: string }) => {
		if (isGenerating) return;

		// Don't reset states immediately - let the agent determine the action first
		// Add user message immediately
		const userMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			parts: [{ type: 'text', text: input.text }],
		};
		const updatedMessages = [...messages, userMessage];
		setMessages(updatedMessages);

		try {
			// Use the agent system instead of basic chat
			const response = await fetch('/api/agent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: input.text,
					conversationId: conversationId || undefined,
					currentGenerationId:
						currentGenerationId !== 'preview' ? currentGenerationId : undefined,
				}),
			});

			console.log('Agent request:', {
				message: input.text,
				conversationId,
				currentGenerationId,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Parse the JSON response from the agent
			const data = await response.json();
			console.log('Agent response:', data);

			// Handle different agent responses with appropriate state management
			let aiResponseText = '';

			if (data.action === 'generate') {
				// Only for NEW generation, set generating states
				setIsGenerating(true);
				setIsGenerationComplete(false);
				setCurrentGenerationId('preview');

				aiResponseText = data.html || data.message;

				// Update conversation ID and generation ID if provided
				if (data.conversationId && !conversationId) {
					setConversationId(data.conversationId);
					setSidebarRefreshTrigger((prev) => prev + 1);
					window.history.replaceState(null, '', `/?c=${data.conversationId}`);
				}

				if (data.generationId) {
					setCurrentGenerationId(data.generationId);
				}

				setIsGenerationComplete(true);
				setIsGenerating(false);
			} else if (data.action === 'edit') {
				// For edit, DON'T reset generation states - keep existing website visible
				aiResponseText = data.html || data.message;

				// Update conversation ID if this creates a new conversation
				if (data.conversationId && !conversationId) {
					setConversationId(data.conversationId);
					setSidebarRefreshTrigger((prev) => prev + 1);
					window.history.replaceState(null, '', `/?c=${data.conversationId}`);
				}

				// Update generation ID if provided (new version)
				if (data.generationId) {
					setCurrentGenerationId(data.generationId);
				}
			} else if (data.action === 'deploy') {
				// For deploy, DON'T change any generation states - keep website visible
				aiResponseText = data.message;

				// Trigger deployment in LivePreview component by incrementing counter
				setTriggerDeployment((prev) => prev + 1);
			} else if (data.action === 'download') {
				// For download, DON'T change any generation states
				aiResponseText = data.message;

				// Trigger the actual file download
				if (data.html && data.filename) {
					const blob = new Blob([data.html], { type: 'text/html' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = data.filename;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);

					aiResponseText += '\n\nDownload started!';
				}
			} else {
				aiResponseText = data.message || 'Action completed successfully!';
			}

			// Create AI message with the response - ensure unique ID for each message
			const aiMessage = {
				id: crypto.randomUUID(), // Always use unique ID for chat messages
				role: 'assistant',
				parts: [{ type: 'text', text: aiResponseText }],
			};

			// Add AI message
			setMessages((prev) => [...prev, aiMessage]);
		} catch (error) {
			console.error('Error sending message:', error);
			// Add error message
			const errorMessage = {
				id: crypto.randomUUID(),
				role: 'assistant',
				parts: [
					{
						type: 'text',
						text: 'Sorry, there was an error processing your request. Please try again.',
					},
				],
			};
			setMessages((prev) => [...prev, errorMessage]);

			// Reset generating states only if they were set
			setIsGenerating(false);
		}
		// Note: No finally block that always resets isGenerating
		// States are managed per action type above
	};

	const { data: session, isPending } = useSession();
	const [conversationTitle, setConversationTitle] = useState('');

	// Load conversation details if we have a conversation ID
	useEffect(() => {
		if (!session?.user) {
			// If no session, clear everything
			setMessages([]);
			setConversationTitle('');
			setCurrentGenerationId('preview');
			setIsGenerationComplete(false);
			setIsGenerating(false);
			return;
		}

		if (conversationId) {
			// Don't clear state if we're generating to avoid interrupting the process
			if (!isGenerating) {
				// Clear current state before loading new conversation
				setMessages([]);
				setConversationTitle('');
				setCurrentGenerationId('preview');
				setIsGenerationComplete(false);

				// Add a small delay to prevent rapid loading when switching conversations
				const timeoutId = setTimeout(() => {
					loadConversation(conversationId);
				}, 100);

				return () => clearTimeout(timeoutId);
			}
		} else {
			// No conversation ID - this is a new conversation state
			if (!isGenerating) {
				setMessages([]);
				setConversationTitle('');
				setCurrentGenerationId('preview');
				setIsGenerationComplete(false);
			}
		}
	}, [conversationId, session?.user]); // Removed isGenerating from deps to prevent clearing during generation

	// Load a specific conversation
	const loadConversation = async (convId: string) => {
		// Don't load if we're currently generating to avoid conflicts
		if (isGenerating) {
			return;
		}

		try {
			const response = await fetch(`/api/conversations/${convId}`);
			if (response.ok) {
				const data = await response.json();
				setConversationTitle(data.title || '');

				// Load the conversation messages as they were saved
				// The API should return messages in the correct order already
				const rawMessages = data.messages || [];

				// Ensure all messages have unique IDs to prevent React key conflicts
				const messagesWithUniqueIds = rawMessages.map((message: any) => ({
					...message,
					id: message.id || crypto.randomUUID(),
				}));

				setMessages(messagesWithUniqueIds);
				if (data.currentGeneration) {
					setCurrentGenerationId(data.currentGeneration.id);
					setIsGenerationComplete(true);
				} else {
					setCurrentGenerationId('preview');
					setIsGenerationComplete(false);
				}
			}
		} catch (error) {
			console.error('Error loading conversation:', error);
		}
	};

	// Handle conversation selection from sidebar
	const handleConversationSelect = (convId: string) => {
		// Don't switch conversations while generating
		if (isGenerating) {
			return;
		}

		if (convId !== conversationId) {
			setConversationId(convId);
			// Update URL without page reload
			router.push(`/?c=${convId}`, { scroll: false });
		}
	};

	// Extract the most recent AI response for preview
	const latestAIResponse = useMemo(() => {
		// If we have a specific current generation ID, prioritize that
		if (currentGenerationId && currentGenerationId !== 'preview') {
			const currentGenMessage = messages.find(
				(m: any) => m.role === 'assistant' && m.id === currentGenerationId,
			);
			if (currentGenMessage) {
				const responseText = currentGenMessage.parts
					.filter((part: any) => part.type === 'text')
					.map((part: any) => part.text)
					.join('');
				console.log('📄 Getting AI response for current generation:', {
					id: currentGenerationId,
					preview: responseText.substring(0, 100) + '...',
				});
				return responseText;
			}
		}

		// Fallback to the latest AI message
		const aiMessages = messages.filter((m: any) => m.role === 'assistant');
		if (aiMessages.length === 0) return '';

		const latestMessage = aiMessages[aiMessages.length - 1];
		const responseText = latestMessage.parts
			.filter((part: any) => part.type === 'text')
			.map((part: any) => part.text)
			.join('');
		console.log('📄 Getting latest AI response (fallback):', {
			preview: responseText.substring(0, 100) + '...',
		});
		return responseText;
	}, [messages, currentGenerationId]);

	const handleNewConversation = () => {
		// Clear all conversation state
		setConversationTitle('');
		setMessages([]);
		setConversationId(null);
		setCurrentGenerationId('preview');
		setIsGenerationComplete(false);
		setIsGenerating(false);

		// Navigate to clean URL without conversation parameter
		router.push('/', { scroll: false });
	};

	// HTML Editor handlers
	const handleExpandEditor = (isExpanded: boolean) => {
		setIsEditorExpanded(isExpanded);
		if (isExpanded) {
			setCurrentEditingHtml(latestAIResponse);
		}
	};

	const handleEditorSave = (newHtml: string) => {
		console.log('🔄 Saving HTML changes...', {
			newHtml: newHtml.substring(0, 100) + '...',
			currentGenerationId,
			messagesLength: messages.length,
		});

		// Update the messages with the new HTML
		setMessages((prevMessages) => {
			const newMessages = [...prevMessages];
			let updated = false;

			// Find the AI message with the current generation ID and update it
			if (currentGenerationId && currentGenerationId !== 'preview') {
				const messageIndex = newMessages.findIndex(
					(m: any) => m.role === 'assistant' && m.id === currentGenerationId,
				);
				if (messageIndex !== -1) {
					newMessages[messageIndex] = {
						...newMessages[messageIndex],
						parts: [{ type: 'text', text: newHtml }],
					};
					updated = true;
					console.log(
						'✅ Updated message for generation ID:',
						currentGenerationId,
						'at index:',
						messageIndex,
					);
				}
			}

			if (!updated) {
				// Fallback: Find the latest AI message and update it
				for (let i = newMessages.length - 1; i >= 0; i--) {
					if (newMessages[i].role === 'assistant') {
						newMessages[i] = {
							...newMessages[i],
							parts: [{ type: 'text', text: newHtml }],
						};
						console.log('✅ Updated latest AI message at index:', i);
						updated = true;
						break;
					}
				}
			}

			if (updated) {
				console.log(
					'📊 Messages updated successfully. New length:',
					newMessages.length,
				);
			} else {
				console.warn('⚠️ No AI message found to update!');
			}

			return newMessages;
		});

		// Update the current editing HTML to reflect the saved changes
		setCurrentEditingHtml(newHtml);
		console.log('💾 HTML save completed');
	};

	const handleEditorClose = () => {
		setIsEditorExpanded(false);
		setCurrentEditingHtml('');
	};

	const handleEditorHtmlChange = (newHtml: string) => {
		setCurrentEditingHtml(newHtml);
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
			<header className='flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm flex-shrink-0 z-20 relative'>
				<div className='flex items-center gap-6'>
					<div className='flex items-center gap-2'>
						<img src='/globe.svg' alt='SiteGen Logo' className='w-6 h-6' />
						<h1 className='text-xl font-bold'>SiteGen</h1>
					</div>
					<nav className='hidden md:flex items-center gap-4'>
						<Link
							href='/docs'
							className='text-sm text-muted-foreground hover:text-foreground transition-colors'
						>
							Docs
						</Link>
						<Link
							href='/about'
							className='text-sm text-muted-foreground hover:text-foreground transition-colors'
						>
							About Us
						</Link>
					</nav>
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
					{/* Mobile menu button */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className='md:hidden p-2 hover:bg-muted rounded-md'
					>
						{mobileMenuOpen ? (
							<X className='w-4 h-4' />
						) : (
							<Menu className='w-4 h-4' />
						)}
					</button>
					<ThemeToggle />
					{session?.user && (
						<ProfileDropdown
							user={{
								id: session.user.id,
								name: session.user.name,
								email: session.user.email,
								image: session.user.image,
								emailVerified: session.user.emailVerified,
								createdAt: new Date(session.user.createdAt),
							}}
						/>
					)}
				</div>

				{/* Mobile Navigation Menu */}
				{mobileMenuOpen && (
					<div className='absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b md:hidden z-40 shadow-lg'>
						<nav className='flex flex-col p-4 gap-4'>
							<Link
								href='/docs'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'
								onClick={() => setMobileMenuOpen(false)}
							>
								Docs
							</Link>
							<Link
								href='/about'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'
								onClick={() => setMobileMenuOpen(false)}
							>
								About Us
							</Link>
						</nav>
					</div>
				)}
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
							Sign in to start generating websites with AI
						</p>
						<MultiAuthButton />
					</div>
				) : isMobile ? (
					// Mobile Layout - Vertical Stack
					<div
						className={`flex flex-col h-full bg-background/15 resizable-container ${
							isDraggingChat ? 'dragging' : ''
						}`}
					>
						{/* Conversation Sidebar - Mobile Overlay */}
						{sidebarOpen && (
							<>
								<div className='fixed z-30 h-full w-80 max-w-[80vw] shadow-lg bg-background/30 border-r'>
									<ConversationSidebar
										currentConversationId={conversationId}
										onConversationSelect={handleConversationSelect}
										onNewConversation={handleNewConversation}
										refreshTrigger={sidebarRefreshTrigger}
									/>
								</div>
								{/* Mobile overlay to close sidebar */}
								<div
									className='fixed inset-0 bg-black/20 z-20'
									onClick={() => setSidebarOpen(false)}
								/>
							</>
						)}

						{/* Live Preview - Top Half on Mobile */}
						<div className='flex flex-col h-1/2 bg-background/25 relative z-0'>
							{/* Preview Header */}
							<div className='p-3 border-b bg-muted/15 flex-shrink-0'>
								<div className='flex items-center justify-between'>
									<div>
										<h2 className='text-sm font-semibold'>Live Preview</h2>
										<p className='text-xs text-muted-foreground'>
											Your generated website will appear here
										</p>
									</div>
									<button
										onClick={() => setSidebarOpen(!sidebarOpen)}
										className='text-xs px-2 py-1 hover:bg-muted rounded'
									>
										{sidebarOpen ? 'Hide' : 'Show'} Conversations
									</button>
								</div>
							</div>

							{/* Preview Content */}
							<div className='flex-1 overflow-hidden'>
								{latestAIResponse ? (
									<LivePreview
										key={`${currentGenerationId}-${latestAIResponse.length}`}
										htmlContent={latestAIResponse}
										generationId={currentGenerationId}
										isGenerationComplete={isGenerationComplete}
										isGenerating={isGenerating}
										onExpandEditor={handleExpandEditor}
										triggerDeployment={triggerDeployment}
									/>
								) : (
									<div className='flex items-center justify-center h-full text-center p-4'>
										<div>
											<div className='w-12 h-12 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center'>
												<svg
													className='w-6 h-6 text-muted-foreground'
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
											<h3 className='text-sm font-semibold mb-1'>
												{conversationId
													? 'Loading Website...'
													: 'No Website Generated Yet'}
											</h3>
											<p className='text-muted-foreground text-xs'>
												{conversationId
													? 'Your website will appear here once loaded'
													: 'Start a conversation to generate your first website'}
											</p>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Chat Interface - Bottom Half on Mobile */}
						<div className='flex flex-col h-1/2 bg-background/25 border-t relative z-0'>
							{/* Chat Header */}
							<div className='p-3 border-b bg-muted/15 flex-shrink-0'>
								<p className='text-sm text-muted-foreground'>
									Welcome back, <strong>{session.user.name}</strong>!
									{conversationId
										? ` Continue editing your website.`
										: ' Start a new conversation.'}
								</p>
							</div>

							{/* Messages Container */}
							<div className='flex-1 overflow-hidden'>
								<div className='h-full overflow-y-auto p-4 space-y-4 scroll-smooth'>
									{messages.length === 0 ? (
										<div className='flex items-center justify-center h-full text-center'>
											<div>
												<h3 className='text-sm font-semibold mb-2'>
													{conversationId
														? 'Continue Editing'
														: 'Start Creating!'}
												</h3>
												<p className='text-muted-foreground text-xs'>
													{conversationId
														? 'Make changes to your website by describing what you want to modify.'
														: "Describe the website you want to build and I'll generate the HTML for you."}
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
										</>
									)}
								</div>
							</div>

							{/* Input Form */}
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
					</div>
				) : (
					// Desktop Layout - Horizontal
					<div
						className={`flex h-full bg-background/15 resizable-container ${
							isDraggingChat ? 'dragging' : ''
						}`}
					>
						{/* Conversation Sidebar */}
						{sidebarOpen && (
							<>
								<div
									className='bg-background/30 border-r relative'
									style={{ width: `${sidebarWidth}px` }}
								>
									<ConversationSidebar
										currentConversationId={conversationId}
										onConversationSelect={handleConversationSelect}
										onNewConversation={handleNewConversation}
										refreshTrigger={sidebarRefreshTrigger}
									/>
								</div>
							</>
						)}

						{/* Chat Interface or HTML Editor */}
						<div
							className='flex flex-col border-r h-full bg-background/25 relative z-0'
							style={{
								width: sidebarOpen
									? `calc((100% - ${sidebarWidth}px) * ${chatWidth / 100})`
									: `${chatWidth}%`,
							}}
						>
							{isEditorExpanded ? (
								/* HTML Editor Mode */
								<HtmlEditor
									htmlContent={currentEditingHtml}
									generationId={currentGenerationId}
									onSave={handleEditorSave}
									onClose={handleEditorClose}
									onHtmlChange={handleEditorHtmlChange}
								/>
							) : (
								/* Normal Chat Mode */
								<>
									{/* Chat Header */}
									<div className='p-3 border-b bg-muted/15 flex-shrink-0'>
										<div className='flex items-center justify-between'>
											<p className='text-sm text-muted-foreground'>
												Welcome back, <strong>{session.user.name}</strong>!
												{conversationId
													? ` Continue editing your website.`
													: ' Start a new conversation.'}
											</p>
											<button
												onClick={() => setSidebarOpen(!sidebarOpen)}
												className='text-xs px-2 py-1 hover:bg-muted rounded'
											>
												{sidebarOpen ? 'Hide' : 'Show'} Conversations
											</button>
										</div>
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
								</>
							)}
						</div>

						{/* Chat Resize Handle */}
						<div
							className='w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors resize-handle relative group'
							onMouseDown={handleChatMouseDown}
							onTouchStart={handleChatTouchStart}
						>
							<div className='absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/20'></div>
						</div>

						{/* Right Side - Live Preview with Full Height */}
						<div
							className='flex flex-col h-full bg-background/25 relative z-0'
							style={{ width: `${100 - chatWidth}%` }}
						>
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
										key={`${currentGenerationId}-${latestAIResponse.length}`}
										htmlContent={latestAIResponse}
										generationId={currentGenerationId}
										isGenerationComplete={isGenerationComplete}
										isGenerating={isGenerating}
										onExpandEditor={handleExpandEditor}
										triggerDeployment={triggerDeployment}
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
