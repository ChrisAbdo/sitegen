'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark'>('light');

	useEffect(() => {
		// Get initial theme from localStorage or system preference
		const savedTheme = localStorage.getItem('theme');
		const systemPrefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)',
		).matches;

		if (savedTheme === 'dark' || savedTheme === 'light') {
			setTheme(savedTheme);
		} else {
			setTheme(systemPrefersDark ? 'dark' : 'light');
		}
	}, []);

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);
		localStorage.setItem('theme', newTheme);

		// Apply theme to document
		if (newTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	};

	return (
		<button
			onClick={toggleTheme}
			className='p-2 rounded-lg hover:bg-muted/50 transition-all duration-300 border border-border/50 hover:border-border hover:shadow-md active:scale-95'
			aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
		>
			<div className='relative w-5 h-5'>
				{theme === 'light' ? (
					// Moon icon for dark mode
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='20'
						height='20'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						className='text-foreground transition-all duration-300 hover:text-primary'
					>
						<path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'></path>
					</svg>
				) : (
					// Sun icon for light mode
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='20'
						height='20'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						className='text-foreground transition-all duration-300 hover:text-primary animate-spin-slow'
					>
						<circle cx='12' cy='12' r='5'></circle>
						<path d='M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'></path>
					</svg>
				)}
			</div>
		</button>
	);
}
