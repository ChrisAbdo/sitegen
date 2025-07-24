'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ProfileDropdown } from './profile-dropdown';
import { signIn } from '@/lib/auth-client';
import { Github } from 'lucide-react';

export function AuthButton() {
	const { data: session, isPending } = useSession();

	const handleSignIn = async () => {
		await signIn.social({
			provider: 'github',
			callbackURL: '/',
		});
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
		<Button onClick={handleSignIn} variant='outline' size='sm'>
			<Github className='mr-2 h-4 w-4' />
			Sign in with GitHub
		</Button>
	);
}
