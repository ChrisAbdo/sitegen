'use client';

import { useSession } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/theme-toggle';
import { MultiAuthButton } from '@/components/multi-auth-button';
import { ProfileDropdown } from '@/components/profile-dropdown';
import Link from 'next/link';
import { ArrowLeft, Mail, User, Briefcase } from 'lucide-react';

export default function AboutPage() {
	const { data: session } = useSession();

	const teamMembers = [
		{
			name: 'Xuanzhi Zhao',
			role: 'Project Manager',
			email: 'xz39@njit.edu',
			description:
				'Leading the project vision and coordinating development efforts.',
		},
		{
			name: 'Christopher Abdo',
			role: 'Full Stack Developer',
			email: 'cja48@njit.edu',
			description:
				'Architecting the frontend and backend systems with modern web technologies.',
		},
		{
			name: 'Joel George',
			role: 'Full Stack Developer',
			email: 'jg827@njit.edu',
			description:
				'Developing core features and ensuring robust application performance.',
		},
	];

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
				<div className='mb-12 text-center'>
					<h1 className='text-4xl font-bold mb-4'>About SiteGen</h1>
					<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
						Meet the talented team behind SiteGen - an innovative AI-powered
						website generator that makes web development accessible to everyone.
					</p>
				</div>

				{/* Project Overview */}
				<section className='mb-12'>
					<h2 className='text-2xl font-semibold mb-6'>Our Mission</h2>
					<div className='prose prose-neutral dark:prose-invert max-w-none'>
						<p className='text-muted-foreground leading-relaxed'>
							SiteGen was created with the vision of democratizing web
							development. We believe that everyone should have the ability to
							create beautiful, functional websites without needing extensive
							coding knowledge. By leveraging the power of AI, we've built a
							platform that translates natural language descriptions into
							production-ready websites.
						</p>
					</div>
				</section>

				{/* Team Section */}
				<section className='mb-12'>
					<h2 className='text-2xl font-semibold mb-8'>Meet Our Team</h2>
					<div className='grid md:grid-cols-1 lg:grid-cols-1 gap-8'>
						{teamMembers.map((member, index) => (
							<div
								key={index}
								className='border rounded-lg p-6 hover:shadow-md transition-shadow'
							>
								<div className='flex items-start gap-4'>
									<div className='flex-shrink-0'>
										<div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center'>
											<User className='w-8 h-8 text-primary' />
										</div>
									</div>
									<div className='flex-1'>
										<h3 className='text-xl font-semibold mb-1'>
											{member.name}
										</h3>
										<div className='flex items-center gap-2 mb-3'>
											<Briefcase className='w-4 h-4 text-muted-foreground' />
											<span className='text-primary font-medium'>
												{member.role}
											</span>
										</div>
										<p className='text-muted-foreground mb-3'>
											{member.description}
										</p>
										<div className='flex items-center gap-2 text-sm'>
											<Mail className='w-4 h-4 text-muted-foreground' />
											<a
												href={`mailto:${member.email}`}
												className='text-primary hover:underline'
											>
												{member.email}
											</a>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* Technology Stack */}
				<section className='mb-12'>
					<h2 className='text-2xl font-semibold mb-6'>Technology Stack</h2>
					<div className='grid md:grid-cols-2 gap-6'>
						<div className='border rounded-lg p-4'>
							<h3 className='font-semibold mb-3'>Frontend</h3>
							<ul className='text-muted-foreground space-y-1'>
								<li>• Next.js 15 with App Router</li>
								<li>• React 18 with TypeScript</li>
								<li>• Tailwind CSS for styling</li>
								<li>• ShadCN UI components</li>
							</ul>
						</div>
						<div className='border rounded-lg p-4'>
							<h3 className='font-semibold mb-3'>Backend</h3>
							<ul className='text-muted-foreground space-y-1'>
								<li>• PostgreSQL database</li>
								<li>• Drizzle ORM</li>
								<li>• Better-Auth authentication</li>
								<li>• RESTful API endpoints</li>
							</ul>
						</div>
						<div className='border rounded-lg p-4'>
							<h3 className='font-semibold mb-3'>AI & Services</h3>
							<ul className='text-muted-foreground space-y-1'>
								<li>• Google Gemini AI</li>
								<li>• OpenAI integration</li>
								<li>• Netlify deployment</li>
								<li>• Real-time streaming</li>
							</ul>
						</div>
						<div className='border rounded-lg p-4'>
							<h3 className='font-semibold mb-3'>Authentication</h3>
							<ul className='text-muted-foreground space-y-1'>
								<li>• GitHub OAuth</li>
								<li>• Google OAuth</li>
								<li>• Facebook OAuth</li>
								<li>• Secure session management</li>
							</ul>
						</div>
					</div>
				</section>

				{/* Features */}
				<section className='mb-12'>
					<h2 className='text-2xl font-semibold mb-6'>
						What Makes SiteGen Special
					</h2>
					<div className='space-y-4'>
						<div className='flex items-start gap-3'>
							<div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0'></div>
							<div>
								<h3 className='font-semibold mb-1'>AI-Powered Generation</h3>
								<p className='text-muted-foreground'>
									Our advanced AI understands natural language and converts your
									ideas into clean, modern, and responsive websites.
								</p>
							</div>
						</div>
						<div className='flex items-start gap-3'>
							<div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0'></div>
							<div>
								<h3 className='font-semibold mb-1'>Real-Time Preview</h3>
								<p className='text-muted-foreground'>
									Watch your website come to life in real-time as our AI
									generates the code, with instant visual feedback.
								</p>
							</div>
						</div>
						<div className='flex items-start gap-3'>
							<div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0'></div>
							<div>
								<h3 className='font-semibold mb-1'>One-Click Deployment</h3>
								<p className='text-muted-foreground'>
									Deploy your website instantly to Netlify with automatic domain
									setup and SSL certificates.
								</p>
							</div>
						</div>
						<div className='flex items-start gap-3'>
							<div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0'></div>
							<div>
								<h3 className='font-semibold mb-1'>
									Multi-Provider Authentication
								</h3>
								<p className='text-muted-foreground'>
									Secure sign-in with GitHub, Google, or Facebook - choose what
									works best for you.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Contact */}
				<section className='text-center'>
					<h2 className='text-2xl font-semibold mb-4'>Get in Touch</h2>
					<p className='text-muted-foreground mb-6'>
						Have questions, feedback, or want to collaborate? We'd love to hear
						from you!
					</p>
					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<Link
							href='/docs'
							className='inline-flex items-center justify-center px-6 py-2 border rounded-lg hover:bg-muted transition-colors'
						>
							View Documentation
						</Link>
						<a
							href='mailto:xz39@njit.edu'
							className='inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
						>
							Contact Project Manager
						</a>
					</div>
				</section>
			</div>
		</div>
	);
}
