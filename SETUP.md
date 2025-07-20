# GitHub Authentication with Better-Auth & Drizzle ORM

This project implements GitHub authentication using Better-Auth and Drizzle ORM with PostgreSQL, featuring a beautiful ShadCN UI profile dropdown component.

## 🚀 Features Implemented

- ✅ **GitHub OAuth Authentication** via Better-Auth
- ✅ **PostgreSQL Database** with Drizzle ORM
- ✅ **Profile Dropdown Component** with ShadCN UI
- ✅ **User Avatar with Fallback Initials**
- ✅ **Session Management** with secure JWT tokens
- ✅ **Responsive Design** with Tailwind CSS
- ✅ **Type-Safe Database Operations** with TypeScript

## 📁 Project Structure

```
lib/
├── auth.ts              # Better-auth server configuration
├── auth-client.ts       # Client-side auth utilities
└── db/
    ├── index.ts         # Database connection
    ├── schema.ts        # Database schema (users, sessions, accounts)
    └── migrations/      # Auto-generated migrations

components/
├── ui/                  # ShadCN UI components
├── user-avatar.tsx      # User avatar component
├── profile-dropdown.tsx # Profile dropdown menu
└── auth-button.tsx      # Authentication button

app/
├── api/auth/[...all]/   # Better-auth API routes
└── page.tsx             # Updated chat page with auth
```

## 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET="a-32-character-secret-key-replace-this-with-random-string"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database Configuration (PostgreSQL)
# Replace with your actual database URL
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# GitHub OAuth Configuration
# Get these from https://github.com/settings/applications/new
# Set Authorization callback URL to: http://localhost:3000/api/auth/callback/github
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## 2. Generate Better Auth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

## 3. GitHub OAuth App Setup

1. Go to https://github.com/settings/applications/new
2. Fill in the following:
   - **Application name**: `AI Chat App` (or your preferred name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copy the **Client ID** and **Client Secret** to your `.env.local` file

## 4. Database Setup Options

Choose one of the following database options:

### Option A: Docker (Recommended for development)

```bash
docker run --name postgres-auth -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sitegen -p 5432:5432 -d postgres
```

Then use: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sitegen"`

### Option B: Neon (Recommended for production)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

### Option C: Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string to `DATABASE_URL`

## 5. Run Database Migrations

After setting up the database:

```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations to database
```

## 6. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see your authenticated chat application!

## 🎨 Components Overview

### ProfileDropdown

- Displays user avatar, name, email, and verification status
- Shows join date and account verification badge
- Includes sign-out functionality with proper session cleanup

### AuthButton

- Shows sign-in button when user is not authenticated
- Displays profile dropdown when user is signed in
- Handles loading states with skeleton UI

### UserAvatar

- Displays user's GitHub avatar if available
- Falls back to initials from user's name
- Responsive sizing with proper accessibility

## 🔧 Database Schema

The following tables are automatically created:

- **`user`**: Stores user information (id, name, email, image, verification status)
- **`session`**: Manages user sessions with JWT tokens
- **`account`**: Stores OAuth provider information (GitHub account linking)
- **`verification`**: Handles email verification and password reset tokens

## 🛠️ Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run db:generate`: Generate database migrations
- `npm run db:migrate`: Apply database migrations
- `npm run db:push`: Push schema changes directly (development only)
- `npm run db:studio`: Open Drizzle Studio (visual database browser)

## 🔐 Security Features

- **Secure JWT Sessions**: 7-day expiration with 24-hour refresh
- **CSRF Protection**: Built-in with Better-Auth
- **Type-Safe Database**: Full TypeScript integration
- **Environment Variable Validation**: Runtime checks for required configs

## 🚀 Deployment

For production deployment:

1. Set up a production PostgreSQL database (Neon/Supabase recommended)
2. Update environment variables for production
3. Run migrations: `npm run db:migrate`
4. Deploy to Vercel/Netlify/your preferred platform

## 🆘 Troubleshooting

**Database Connection Issues:**

- Verify your `DATABASE_URL` is correct
- Ensure your database is running (if using Docker)
- Check firewall settings for remote databases

**GitHub OAuth Issues:**

- Verify callback URL matches exactly: `http://localhost:3000/api/auth/callback/github`
- Ensure Client ID and Secret are correct
- Check that your GitHub app is not suspended

**Migration Issues:**

- Delete `lib/db/migrations` folder and regenerate if needed
- Ensure database is empty before first migration
- Check database permissions
