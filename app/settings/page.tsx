'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Monitor, Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
	const router = useRouter();
	const { data: session, isPending } = useSession();
	const [theme, setTheme] = useState<Theme>('system');

	// Check authentication
	useEffect(() => {
		if (!isPending && !session) {
			router.push('/');
		}
	}, [session, isPending, router]);

	// Load theme from localStorage
	useEffect(() => {
		const savedTheme = localStorage.getItem('theme') as Theme;
		if (savedTheme) {
			setTheme(savedTheme);
		}
	}, []);

	// Apply theme changes
	useEffect(() => {
		const root = window.document.documentElement;

		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
				.matches
				? 'dark'
				: 'light';
			root.classList.toggle('dark', systemTheme === 'dark');
		} else {
			root.classList.toggle('dark', theme === 'dark');
		}

		localStorage.setItem('theme', theme);
	}, [theme]);

	const handleThemeChange = (newTheme: Theme) => {
		setTheme(newTheme);
	};

	if (isPending) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 max-w-2xl'>
				<div className='flex items-center gap-4 mb-8'>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => router.back()}
						className='flex items-center gap-2'
					>
						<ArrowLeft className='h-4 w-4' />
						Back
					</Button>
					<h1 className='text-2xl font-bold'>Settings</h1>
				</div>

				<div className='space-y-6'>
					{/* Theme Settings */}
					<div className='border rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-4'>Appearance</h2>
						<p className='text-sm text-muted-foreground mb-4'>
							Choose your preferred theme for the interface.
						</p>

						<div className='grid grid-cols-3 gap-3'>
							<button
								onClick={() => handleThemeChange('light')}
								className={`p-4 border rounded-lg text-center transition-colors ${
									theme === 'light'
										? 'border-primary bg-primary/10'
										: 'border-border hover:bg-muted'
								}`}
							>
								<Sun className='h-6 w-6 mx-auto mb-2' />
								<span className='text-sm font-medium'>Light</span>
							</button>

							<button
								onClick={() => handleThemeChange('dark')}
								className={`p-4 border rounded-lg text-center transition-colors ${
									theme === 'dark'
										? 'border-primary bg-primary/10'
										: 'border-border hover:bg-muted'
								}`}
							>
								<Moon className='h-6 w-6 mx-auto mb-2' />
								<span className='text-sm font-medium'>Dark</span>
							</button>

							<button
								onClick={() => handleThemeChange('system')}
								className={`p-4 border rounded-lg text-center transition-colors ${
									theme === 'system'
										? 'border-primary bg-primary/10'
										: 'border-border hover:bg-muted'
								}`}
							>
								<Monitor className='h-6 w-6 mx-auto mb-2' />
								<span className='text-sm font-medium'>System</span>
							</button>
						</div>
					</div>

					{/* User Info */}
					<div className='border rounded-lg p-6'>
						<h2 className='text-lg font-semibold mb-4'>Account Information</h2>
						<div className='space-y-3'>
							<div>
								<label className='text-sm font-medium text-muted-foreground'>
									Name
								</label>
								<p className='text-sm'>{session.user.name}</p>
							</div>
							<div>
								<label className='text-sm font-medium text-muted-foreground'>
									Email
								</label>
								<p className='text-sm'>{session.user.email}</p>
							</div>
							<div>
								<label className='text-sm font-medium text-muted-foreground'>
									Member Since
								</label>
								<p className='text-sm'>
									{new Date(session.user.createdAt).toLocaleDateString()}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
