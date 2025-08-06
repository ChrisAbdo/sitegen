'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Clock } from 'lucide-react';
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
								onClick={() => handleConversationClick(conversation.id)}
								className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
									currentConversationId === conversation.id
										? 'bg-muted border border-border'
										: ''
								}`}
							>
								<div className='flex flex-col gap-1'>
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
							</div>
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
