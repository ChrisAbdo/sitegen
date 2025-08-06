'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Conversation {
	id: string;
	title: string;
	description: string;
	currentGeneration: any;
	createdAt: string;
	updatedAt: string;
}

interface ConversationSidebarProps {
	currentConversationId?: string | null;
	onConversationSelect: (conversationId: string) => void;
	onNewConversation: () => void;
	refreshTrigger?: number; // Add refresh trigger
}

export function ConversationSidebar({
	currentConversationId,
	onConversationSelect,
	onNewConversation,
	refreshTrigger,
}: ConversationSidebarProps) {
	const { data: session } = useSession();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		if (session?.user) {
			loadConversations();
		}
	}, [session, refreshTrigger]); // Add refreshTrigger to dependency

	const loadConversations = async () => {
		try {
			const response = await fetch('/api/conversations');
			if (response.ok) {
				const data = await response.json();
				setConversations(data);
			}
		} catch (error) {
			console.error('Error loading conversations:', error);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return 'Today';
		} else if (diffDays === 1) {
			return 'Yesterday';
		} else if (diffDays < 7) {
			return `${diffDays} days ago`;
		} else {
			return date.toLocaleDateString();
		}
	};

	const handleConversationClick = (conversationId: string) => {
		onConversationSelect(conversationId);
		router.push(`/?c=${conversationId}`, { scroll: false });
	};

	const handleDeleteConversation = async (
		conversationId: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation(); // Prevent triggering the conversation click

		if (
			!confirm(
				'Are you sure you want to delete this conversation and all its generated websites?',
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/api/conversations/${conversationId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				// Reload conversations
				await loadConversations();

				// If the deleted conversation was currently selected, clear it
				if (currentConversationId === conversationId) {
					router.push('/', { scroll: false });
					onConversationSelect('');
				}
			} else {
				alert('Failed to delete conversation');
			}
		} catch (error) {
			console.error('Error deleting conversation:', error);
			alert('Error deleting conversation');
		}
	};

	if (!session?.user) {
		return null;
	}

	return (
		<div className='w-80 h-full border-r bg-background/50 backdrop-blur-sm flex flex-col'>
			{/* Header */}
			<div className='p-4 border-b'>
				<Button
					onClick={onNewConversation}
					className='w-full justify-start'
					variant='outline'
				>
					<Plus className='w-4 h-4 mr-2' />
					New Conversation
				</Button>
			</div>

			{/* Conversations List */}
			<ScrollArea className='flex-1'>
				<div className='p-2 space-y-2'>
					{loading ? (
						<div className='flex items-center justify-center p-8'>
							<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
						</div>
					) : conversations.length === 0 ? (
						<div className='text-center p-8 text-muted-foreground'>
							<MessageSquare className='w-8 h-8 mx-auto mb-2 opacity-50' />
							<p className='text-sm'>No conversations yet</p>
							<p className='text-xs'>Start a new conversation to begin</p>
						</div>
					) : (
						conversations.map((conversation) => (
							<div
								key={conversation.id}
								className={`group p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
									currentConversationId === conversation.id
										? 'bg-muted border border-border'
										: ''
								}`}
							>
								<div className='flex items-start justify-between gap-2'>
									<div
										className='flex-1 flex flex-col gap-1'
										onClick={() => handleConversationClick(conversation.id)}
									>
										<h3 className='font-medium text-sm truncate'>
											{conversation.title || 'Untitled Conversation'}
										</h3>
										<p className='text-xs text-muted-foreground truncate'>
											{conversation.description || 'No description'}
										</p>
										<div className='flex items-center gap-1 text-xs text-muted-foreground'>
											<Clock className='w-3 h-3' />
											{formatDate(conversation.updatedAt)}
										</div>
									</div>
									<Button
										variant='ghost'
										size='sm'
										className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all'
										onClick={(e) =>
											handleDeleteConversation(conversation.id, e)
										}
									>
										<Trash2 className='h-4 w-4' />
									</Button>
								</div>
							</div>
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
