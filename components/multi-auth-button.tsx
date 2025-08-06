'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ProfileDropdown } from './profile-dropdown';
import { signIn } from '@/lib/auth-client';
import { Github, Mail } from 'lucide-react';
import { useState } from 'react';

// Custom Google and Facebook icons as SVG components
const GoogleIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox='0 0 24 24'>
		<path
			fill='currentColor'
			d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
		/>
		<path
			fill='currentColor'
			d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
		/>
		<path
			fill='currentColor'
			d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
		/>
		<path
			fill='currentColor'
			d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
		/>
	</svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox='0 0 24 24'>
		<path
			fill='currentColor'
			d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
		/>
	</svg>
);

export function MultiAuthButton() {
	const { data: session, isPending } = useSession();
	const [isSigningIn, setIsSigningIn] = useState<string | null>(null);

	const handleSignIn = async (provider: 'github' | 'google') => {
		setIsSigningIn(provider);
		try {
			await signIn.social({
				provider,
				callbackURL: '/',
			});
		} catch (error) {
			console.error(`Error signing in with ${provider}:`, error);
		} finally {
			setIsSigningIn(null);
		}
	};

	if (isPending) {
		return <div className='h-10 w-10 rounded-full bg-muted animate-pulse' />;
	}

	if (session?.user) {
		return (
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
		);
	}

	return (
		<div className='flex flex-row gap-2 w-full max-w-md justify-center'>
			<Button
				onClick={() => handleSignIn('github')}
				variant='outline'
				size='sm'
				disabled={isSigningIn !== null}
				className='flex-1 justify-center min-w-0'
			>
				{isSigningIn === 'github' ? (
					<div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
				) : (
					<Github className='h-4 w-4 mr-2' />
				)}
				<span className='hidden sm:inline'>GitHub</span>
				<span className='sm:hidden'>GH</span>
			</Button>
			<Button
				onClick={() => handleSignIn('google')}
				variant='outline'
				size='sm'
				disabled={isSigningIn !== null}
				className='flex-1 justify-center min-w-0'
			>
				{isSigningIn === 'google' ? (
					<div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
				) : (
					<GoogleIcon className='h-4 w-4 mr-2' />
				)}
				<span className='hidden sm:inline'>Google</span>
				<span className='sm:hidden'>GO</span>
			</Button>
		</div>
	);
}
