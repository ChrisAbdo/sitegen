'use client';

import { useState, useRef, useEffect } from 'react';
import {
	MessageCircle,
	X,
	Send,
	User,
	Bot,
	Minus,
	RotateCcw,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

interface Message {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

interface FloatingChatProps {
	className?: string;
}

function FloatingChat({ className = '' }: FloatingChatProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			role: 'assistant',
			content:
				"Hi! I'm your navigation assistant 🧭\n\nI can help you:\n• Website: 'create a website for...', 'deploy', 'edit'\n• Navigate: 'go to profile', 'go to settings'\n• Go back: 'go back', 'back'\n• Change theme: 'change theme', 'dark mode'\n\nTry asking me anything!",
			timestamp: new Date(),
		},
	]);
	const [inputValue, setInputValue] = useState('');
	const [isTyping, setIsTyping] = useState(false);

	// Navigation history tracking
	const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
	const [currentPageIndex, setCurrentPageIndex] = useState(-1);

	// Dragging state
	const [position, setPosition] = useState({ x: 20, y: 20 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const router = useRouter();
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Track navigation history
	useEffect(() => {
		if (
			navigationHistory.length === 0 ||
			navigationHistory[navigationHistory.length - 1] !== pathname
		) {
			setNavigationHistory((prev) => {
				const newHistory = [...prev, pathname];
				setCurrentPageIndex(newHistory.length - 1);
				return newHistory;
			});
		}
	}, [pathname]);

	// Auto scroll to bottom of messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const getCurrentPageContext = () => {
		const pageNames: { [key: string]: string } = {
			'/': 'Home',
			'/profile': 'Profile',
			'/settings': 'Settings',
			'/docs': 'Documentation',
			'/about': 'About',
		};
		return pageNames[pathname] || pathname;
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		if (!target.closest('.chat-header')) return;

		setIsDragging(true);
		setDragOffset({
			x: e.clientX - position.x,
			y: e.clientY - position.y,
		});
	};

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isDragging) return;

			// Calculate boundaries based on current state
			const chatWidth = 320;
			const chatHeight = isMinimized ? 48 : 384; // 48px for minimized, 384px for full

			const newX = Math.max(
				0,
				Math.min(window.innerWidth - chatWidth, e.clientX - dragOffset.x),
			);
			const newY = Math.max(
				0,
				Math.min(window.innerHeight - chatHeight, e.clientY - dragOffset.y),
			);
			setPosition({ x: newX, y: newY });
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging, dragOffset, isMinimized]);

	const resetPosition = () => {
		if (isMinimized) {
			// When minimized, move to top-right corner for less screen clutter
			setPosition({ x: window.innerWidth - 340, y: 20 });
		} else {
			// When full-size, move to bottom-left for better chat experience
			setPosition({ x: 20, y: 20 });
		}
	};

	const goBack = () => {
		if (currentPageIndex > 0) {
			const previousPage = navigationHistory[currentPageIndex - 1];
			setCurrentPageIndex(currentPageIndex - 1);
			router.push(previousPage);
			return true;
		}
		return false;
	};

	const handleSendMessage = async () => {
		if (!inputValue.trim()) return;
		setIsTyping(true);

		const newMessage: Message = {
			id: Date.now().toString(),
			role: 'user',
			content: inputValue,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, newMessage]);
		const userInput = inputValue.toLowerCase();
		const originalInput = inputValue;
		setInputValue('');

		// Check if this is a website generation/deployment command
		const isWebsiteCommand =
			userInput.includes('generate') ||
			userInput.includes('create') ||
			userInput.includes('make') ||
			userInput.includes('build') ||
			userInput.includes('deploy') ||
			userInput.includes('publish') ||
			userInput.includes('download') ||
			userInput.includes('edit') ||
			userInput.includes('change') ||
			userInput.includes('modify') ||
			userInput.includes('website') ||
			userInput.includes('site') ||
			userInput.includes('page');

		let assistantResponse = '';
		let navigationAction = false;

		try {
			// Handle website generation/deployment commands
			if (isWebsiteCommand) {
				// Call the agent API for website commands
				const response = await fetch('/api/agent', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						message: originalInput,
					}),
				});

				const data = await response.json();

				if (response.ok) {
					switch (data.action) {
						case 'generate':
							assistantResponse = `✨ ${data.message}\n\n🎯 I've generated your website! You can see it in the main chat interface.`;
							break;
						case 'deploy':
							assistantResponse = `🚀 ${data.message}\n\n🌐 Your site is now live at: ${data.deployUrl}`;
							break;
						case 'both':
							assistantResponse = `🎉 ${data.message}\n\n🌐 Your site is live at: ${data.deployUrl}`;
							break;
						case 'download':
							assistantResponse = `💾 ${data.message}\n\n📄 Check the main interface to download your HTML file.`;
							break;
						case 'edit':
							assistantResponse = `✏️ ${data.message}\n\n🔄 Your website has been updated! Check the main interface.`;
							break;
						default:
							assistantResponse = data.message || 'Website command processed!';
					}
				} else {
					assistantResponse = `❌ ${
						data.error || 'Sorry, there was an error processing your request.'
					}`;
				}
			}
			// Handle navigation commands locally
			else if (userInput.includes('go back') || userInput === 'back') {
				if (goBack()) {
					assistantResponse = '⬅️ Going back to the previous page!';
					navigationAction = true;
				} else {
					assistantResponse =
						"❌ Can't go back - you're already at the first page in your history.";
				}
			} else if (
				userInput.includes('go to home') ||
				userInput.includes('home page')
			) {
				router.push('/');
				assistantResponse = '🏠 Taking you to the home page!';
				navigationAction = true;
			} else if (
				userInput.includes('go to profile') ||
				userInput.includes('profile')
			) {
				router.push('/profile');
				assistantResponse = '👤 Navigating to your profile!';
				navigationAction = true;
			} else if (
				userInput.includes('go to settings') ||
				userInput.includes('settings')
			) {
				router.push('/settings');
				assistantResponse = '⚙️ Opening settings page!';
				navigationAction = true;
			} else if (
				userInput.includes('go to docs') ||
				userInput.includes('documentation')
			) {
				router.push('/docs');
				assistantResponse = '📚 Opening documentation!';
				navigationAction = true;
			} else if (
				userInput.includes('go to about') ||
				userInput.includes('about')
			) {
				router.push('/about');
				assistantResponse = 'ℹ️ Taking you to the about page!';
				navigationAction = true;
			} else if (
				userInput.includes('change theme') ||
				userInput.includes('theme') ||
				userInput.includes('dark mode') ||
				userInput.includes('light mode')
			) {
				const newTheme = theme === 'dark' ? 'light' : 'dark';
				setTheme(newTheme);
				assistantResponse = `🎨 Switched to ${newTheme} theme!`;
			} else if (
				userInput.includes('where am i') ||
				userInput.includes('current page')
			) {
				assistantResponse = `📍 You're currently on: ${getCurrentPageContext()}`;
			} else if (
				userInput.includes('history') ||
				userInput.includes('visited')
			) {
				const historyList = navigationHistory
					.map((path, index) => {
						const pageNames: { [key: string]: string } = {
							'/': 'Home',
							'/profile': 'Profile',
							'/settings': 'Settings',
							'/docs': 'Docs',
							'/about': 'About',
						};
						const pageName = pageNames[path] || path;
						return `${index + 1}. ${pageName}${
							index === currentPageIndex ? ' (current)' : ''
						}`;
					})
					.join('\n');
				assistantResponse = `📖 Your navigation history:\n${historyList}`;
			} else if (userInput.includes('help') || userInput.includes('commands')) {
				assistantResponse = `🆘 Here's what I can help you with:

**Website Commands:**
• "create a website for..." - Generate new websites
• "edit the website..." - Modify existing content
• "deploy my website" - Publish your site online
• "download my website" - Get HTML file

**Navigation:**
• "go to profile" - Visit your profile
• "go to settings" - Open settings
• "go to home" - Return to home page
• "go back" - Go to previous page

**Information:**
• "where am i" - Current page info
• "history" - Show navigation history

**Other:**
• "change theme" - Toggle dark/light mode`;
			} else {
				// Default response for unrecognized commands
				assistantResponse = `🤔 I didn't understand that command. Try:

**Website:** "create a website for my business"
**Navigation:** "go to [page]" or "go back"
**Theme:** "change theme"
**Help:** "help" - See all commands`;
			}

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				content: assistantResponse,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (error) {
			console.error('Chat error:', error);
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: 'assistant',
				content: 'Sorry, I encountered an error. Please try again.',
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsTyping(false);
		}
	};

	return (
		<div className={className}>
			{!isOpen && (
				<div className='fixed bottom-6 right-6 z-50'>
					<button
						onClick={() => setIsOpen(true)}
						className='w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 animate-pulse'
					>
						<MessageCircle className='w-6 h-6' />
					</button>
				</div>
			)}

			{isOpen && (
				<div
					style={{
						left: position.x,
						top: position.y,
					}}
					className={`fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${
						isDragging ? 'cursor-grabbing' : ''
					} ${isMinimized ? 'h-12' : 'h-96'}`}
					onMouseDown={handleMouseDown}
				>
					{/* Header */}
					<div
						className={`chat-header flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white cursor-grab active:cursor-grabbing ${
							isMinimized ? 'p-2 rounded-lg' : 'p-3 rounded-t-lg'
						}`}
					>
						<div className='flex items-center gap-2'>
							<Bot className='w-4 h-4' />
							<span className='font-medium text-sm'>
								{isMinimized
									? `Assistant • ${getCurrentPageContext()}`
									: 'Navigation Assistant'}
							</span>
							{!isMinimized && (
								<span className='text-xs opacity-75'>
									• {getCurrentPageContext()}
								</span>
							)}
						</div>
						<div className='flex items-center gap-1'>
							<button
								onClick={resetPosition}
								className='p-1 hover:bg-white/20 rounded transition-colors'
								title='Reset position'
							>
								<RotateCcw className='w-3 h-3' />
							</button>
							<button
								onClick={() => setIsMinimized(!isMinimized)}
								className='p-1 hover:bg-white/20 rounded transition-colors'
								title={isMinimized ? 'Restore' : 'Minimize'}
							>
								<Minus className='w-3 h-3' />
							</button>
							<button
								onClick={() => setIsOpen(false)}
								className='p-1 hover:bg-white/20 rounded transition-colors'
								title='Close'
							>
								<X className='w-3 h-3' />
							</button>
						</div>
					</div>

					{/* Content - Only show when not minimized */}
					{!isMinimized && (
						<>
							{/* Messages */}
							<div className='flex-1 p-3 overflow-y-auto'>
								{messages.map((message) => (
									<div key={message.id} className='mb-3'>
										<div
											className={`flex items-start gap-2 ${
												message.role === 'user'
													? 'flex-row-reverse'
													: 'flex-row'
											}`}
										>
											<div
												className={`w-7 h-7 rounded-full flex items-center justify-center ${
													message.role === 'user'
														? 'bg-blue-600 text-white'
														: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
												}`}
											>
												{message.role === 'user' ? (
													<User className='w-4 h-4' />
												) : (
													<Bot className='w-4 h-4' />
												)}
											</div>
											<div
												className={`max-w-[200px] p-2 rounded-lg text-sm ${
													message.role === 'user'
														? 'bg-blue-600 text-white'
														: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
												}`}
											>
												<div className='whitespace-pre-wrap'>
													{message.content}
												</div>
											</div>
										</div>
									</div>
								))}

								{isTyping && (
									<div className='flex items-start gap-2 mb-3'>
										<div className='w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
											<Bot className='w-4 h-4 text-gray-600 dark:text-gray-300' />
										</div>
										<div className='bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-lg text-sm'>
											<div className='flex gap-1'>
												<div className='w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce'></div>
												<div className='w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-75'></div>
												<div className='w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-150'></div>
											</div>
										</div>
									</div>
								)}
								<div ref={messagesEndRef} />
							</div>

							{/* Input */}
							<div className='p-3 border-t dark:border-gray-700'>
								<div className='flex gap-2'>
									<input
										type='text'
										value={inputValue}
										onChange={(e) => setInputValue(e.target.value)}
										onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
										placeholder='Try: "go back" or "go to profile"'
										className='flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
										disabled={isTyping}
									/>
									<button
										onClick={handleSendMessage}
										disabled={isTyping || !inputValue.trim()}
										className='px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors'
									>
										<Send className='w-4 h-4' />
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}

export { FloatingChat };
