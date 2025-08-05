# 🌐 SiteGen - AI-Powered Website Generator

SiteGen is a modern AI-powered website generator that transforms your ideas into beautiful, functional websites using advanced language models. Built with Next.js 15, it features real-time chat interface, live preview, and seamless deployment to Netlify.

![SiteGen Demo](https://img.shields.io/badge/Status-Active-green) ![Next.js](https://img.shields.io/badge/Next.js-15.4.2-black) ![React](https://img.shields.io/badge/React-19.1.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

## ✨ Features

### 🤖 AI-Powered Generation

- **Intelligent Website Creation**: Describe your vision and watch AI generate complete HTML websites
- **Real-time Streaming**: See your website being built live with streaming responses
- **Conversation History**: Continue editing and refining your websites across sessions
- **Context-Aware**: AI remembers your previous requests for consistent updates

### 🎨 Modern User Experience

- **Live Preview**: Instant preview of generated websites in split-screen view
- **Animated Background**: Beautiful breathing animations that adapt to login state
- **Dark/Light Theme**: Seamless theme switching with persistent preferences
- **Responsive Design**: Optimized for all device sizes

### 🔐 Authentication & Security

- **GitHub OAuth**: Secure authentication via Better-Auth
- **Session Management**: Persistent user sessions with JWT tokens
- **User Profiles**: Personalized experience with user avatars and names

### 🚀 Deployment & Management

- **One-Click Deploy**: Automatic deployment to Netlify with custom domains
- **Website Management**: View, edit, and delete your deployed websites
- **Deployment Status**: Real-time tracking of deployment progress
- **Generation History**: Access all your previous website generations

### 💾 Data Persistence

- **PostgreSQL Database**: Robust data storage with Drizzle ORM
- **Conversation Storage**: Save and resume website editing sessions
- **User Management**: Secure user data and preferences storage

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **ShadCN UI** - Beautiful, accessible components

### Backend & AI

- **AI SDK** - Streaming AI responses
- **Google AI & OpenAI** - Multiple AI model support
- **Better-Auth** - Modern authentication solution
- **Drizzle ORM** - Type-safe database operations

### Database & Deployment

- **PostgreSQL** - Reliable relational database
- **Netlify API** - Automated website deployment
- **Vercel** - Hosting and edge functions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- GitHub OAuth App
- Google AI API key or OpenAI API key
- Netlify account and API token

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ChrisAbdo/sitegen.git
cd sitegen
```

2. **Install dependencies**

```bash
npm install
# or
bun install
```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sitegen"

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
BETTER_AUTH_URL="http://localhost:3000"

# AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"
# OR
OPENAI_API_KEY="your-openai-key"

# Netlify
NETLIFY_TOKEN="your-netlify-token"
```

4. **Database Setup**

```bash
# Generate database schema
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema to database
npm run db:push
```

5. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see SiteGen in action!

## 📖 Usage

### Creating Your First Website

1. **Sign In**: Use GitHub OAuth to authenticate
2. **Describe Your Vision**: Tell SiteGen what kind of website you want
   - Example: "Create a modern portfolio website for a photographer with a gallery section"
3. **Watch the Magic**: See your website generated in real-time in the live preview
4. **Refine & Edit**: Continue the conversation to make adjustments
5. **Deploy**: Click deploy to publish your website to Netlify with a custom domain

### Managing Websites

- **View Generations**: Access all your previous website generations from your profile
- **Edit Existing**: Continue conversations to modify deployed websites
- **Delete Sites**: Remove websites you no longer need
- **Track Status**: Monitor deployment progress and status

## 🎯 Key Components

### Chat Interface (`app/page.tsx`)

- Real-time streaming chat with AI
- Message history and conversation management
- Context-aware input suggestions

### Live Preview (`components/live-preview.tsx`)

- Iframe-based website preview
- Real-time updates during generation
- Deployment status integration

### Authentication (`lib/auth.ts`)

- GitHub OAuth implementation
- Session management
- User profile handling

### Database Schema (`lib/db/schema.ts`)

- User management
- Conversation storage
- Generation tracking
- Deployment records

## 🔧 Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## 🌟 Advanced Features

### Theme System

- Automatic dark/light mode detection
- Persistent theme preferences
- Smooth transitions and animations

### Conversation Management

- Resume editing sessions
- Conversation titles and organization
- Context preservation across sessions

### Deployment Pipeline

- Automatic Netlify integration
- Custom domain assignment
- Status tracking and monitoring

## 🤝 Contributing

We welcome contributions to SiteGen! Please see our contributing guidelines and feel free to submit pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Vercel AI SDK](https://sdk.vercel.ai/) for AI integration
- [Better-Auth](https://www.better-auth.com/) for authentication
- [ShadCN UI](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Drizzle ORM](https://orm.drizzle.team/) for database operations

---

Built with ❤️ by [Chris Abdo](https://github.com/ChrisAbdo)
