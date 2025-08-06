'use client';

import { useSession } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/theme-toggle';
import { MultiAuthButton } from '@/components/multi-auth-button';
import { ProfileDropdown } from '@/components/profile-dropdown';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DocsPage() {
	const { data: session } = useSession();

	return (
		<div className='min-h-screen bg-background text-foreground'>
			{/* Header */}
			<header className='flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm'>
				<div className='flex items-center gap-4'>
					<Link
						href='/'
						className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'
					>
						<ArrowLeft className='w-4 h-4' />
						Back to SiteGen
					</Link>
				</div>
				<div className='flex items-center gap-3'>
					<ThemeToggle />
					{session?.user ? (
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
					) : (
						<MultiAuthButton />
					)}
				</div>
			</header>

			{/* Main Content */}
			<div className='max-w-4xl mx-auto p-8'>
				<div className='mb-8'>
					<h1 className='text-4xl font-bold mb-4'>SiteGen Documentation</h1>
					<p className='text-lg text-muted-foreground'>
						Learn how to use SiteGen to create amazing websites with AI
						assistance.
					</p>
				</div>

				<div className='space-y-8'>
					{/* Getting Started */}
					<section>
						<h2 className='text-2xl font-semibold mb-4'>Getting Started</h2>
						<div className='prose prose-neutral dark:prose-invert max-w-none'>
							<p>
								SiteGen is an AI-powered website generator that helps you create
								modern, responsive websites through natural conversation. Simply
								describe what you want, and our AI will generate the code for
								you.
							</p>
						</div>
					</section>

					{/* How to Use */}
					<section>
						<h2 className='text-2xl font-semibold mb-4'>How to Use SiteGen</h2>
						<div className='space-y-4'>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>1. Sign In</h3>
								<p className='text-muted-foreground'>
									Choose from GitHub, Google, or Facebook authentication to get
									started.
								</p>
							</div>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>2. Describe Your Website</h3>
								<p className='text-muted-foreground'>
									Tell our AI what kind of website you want. Be specific about
									features, styling, and functionality you need.
								</p>
							</div>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>3. Review & Refine</h3>
								<p className='text-muted-foreground'>
									View the live preview and ask for changes. The AI will iterate
									on your design until it's perfect.
								</p>
							</div>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>4. Deploy</h3>
								<p className='text-muted-foreground'>
									Deploy your website directly to Netlify with one click. Your
									site will be live and accessible worldwide.
								</p>
							</div>
						</div>
					</section>

					{/* Features */}
					<section>
						<h2 className='text-2xl font-semibold mb-4'>Key Features</h2>
						<div className='grid md:grid-cols-2 gap-4'>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>🤖 AI-Powered Generation</h3>
								<p className='text-muted-foreground'>
									Advanced AI understands your requirements and generates clean,
									modern code.
								</p>
							</div>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>👀 Live Preview</h3>
								<p className='text-muted-foreground'>
									See your website in real-time as the AI builds it. No waiting,
									no surprises.
								</p>
							</div>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>🚀 One-Click Deploy</h3>
								<p className='text-muted-foreground'>
									Deploy instantly to Netlify with automatic domain and SSL
									certificate setup.
								</p>
							</div>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>📱 Responsive Design</h3>
								<p className='text-muted-foreground'>
									All generated websites are mobile-friendly and work on any
									device.
								</p>
							</div>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>🔒 Secure Authentication</h3>
								<p className='text-muted-foreground'>
									Multiple OAuth providers ensure secure access to your
									projects.
								</p>
							</div>
							<div className='border rounded-lg p-4'>
								<h3 className='font-semibold mb-2'>💾 Project History</h3>
								<p className='text-muted-foreground'>
									Access all your generated websites from your profile
									dashboard.
								</p>
							</div>
						</div>
					</section>

					{/* Example Prompts */}
					<section>
						<h2 className='text-2xl font-semibold mb-4'>Example Prompts</h2>
						<div className='space-y-3'>
							<div className='bg-muted p-4 rounded-lg'>
								<p className='font-mono text-sm'>
									"Create a modern portfolio website for a photographer with a
									dark theme, image gallery, and contact form"
								</p>
							</div>
							<div className='bg-muted p-4 rounded-lg'>
								<p className='font-mono text-sm'>
									"Build a landing page for a SaaS product with pricing tables,
									testimonials, and a hero section"
								</p>
							</div>
							<div className='bg-muted p-4 rounded-lg'>
								<p className='font-mono text-sm'>
									"Design a restaurant website with menu, location map, and
									online reservation system"
								</p>
							</div>
							<div className='bg-muted p-4 rounded-lg'>
								<p className='font-mono text-sm'>
									"Create a blog website with article listing, search
									functionality, and author profiles"
								</p>
							</div>
						</div>
					</section>

					{/* Tips */}
					<section>
						<h2 className='text-2xl font-semibold mb-4'>
							Tips for Better Results
						</h2>
						<ul className='space-y-2 list-disc list-inside text-muted-foreground'>
							<li>
								Be specific about the purpose and target audience of your
								website
							</li>
							<li>Mention preferred colors, styling, or design inspiration</li>
							<li>Include specific features or functionality you need</li>
							<li>
								Ask for changes iteratively - the AI learns from your feedback
							</li>
							<li>
								Use the live preview to test functionality before deploying
							</li>
						</ul>
					</section>

					{/* Support */}
					<section>
						<h2 className='text-2xl font-semibold mb-4'>Need Help?</h2>
						<p className='text-muted-foreground mb-4'>
							If you have questions or need assistance, feel free to reach out
							to our team through the About Us page.
						</p>
						<Link
							href='/about'
							className='inline-flex items-center text-primary hover:underline'
						>
							Contact the SiteGen Team →
						</Link>
					</section>
				</div>
			</div>
		</div>
	);
}
