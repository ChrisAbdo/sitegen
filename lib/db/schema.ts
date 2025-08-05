import {
	pgTable,
	text,
	timestamp,
	boolean,
	integer,
} from 'drizzle-orm/pg-core';

// Users table
export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('emailVerified').notNull().default(false),
	image: text('image'),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Sessions table
export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expiresAt').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
});

// Accounts table (for OAuth providers)
export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
	refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Verification table (for email verification, password reset, etc.)
export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expiresAt').notNull(),
	createdAt: timestamp('createdAt').defaultNow(),
	updatedAt: timestamp('updatedAt').defaultNow(),
});

// Conversations table - tracks website generation sessions
export const conversation = pgTable('conversation', {
	id: text('id').primaryKey(),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title'), // Auto-generated from first prompt
	description: text('description'), // Brief description of the website
	currentGenerationId: text('currentGenerationId'), // Points to latest version
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// AI Generations table - now tracks versions within conversations
export const aiGeneration = pgTable('ai_generation', {
	id: text('id').primaryKey(),
	conversationId: text('conversationId')
		.notNull()
		.references(() => conversation.id, { onDelete: 'cascade' }),
	userId: text('userId')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	version: integer('version').notNull().default(1), // Version number within conversation
	userPrompt: text('userPrompt').notNull(), // The user's request/prompt
	aiResponse: text('aiResponse').notNull(), // The generated HTML/response
	previousHtml: text('previousHtml'), // Previous version's HTML for context
	model: text('model').notNull().default('gemini-2.5-flash'), // AI model used
	status: text('status').notNull().default('completed'), // completed, failed, pending
	isCurrentVersion: boolean('isCurrentVersion').notNull().default(true), // Track current version
	// Deployment status fields
	deploymentStatus: text('deploymentStatus').notNull().default('not_deployed'), // not_deployed, deploying, deployed, failed
	deploymentUrl: text('deploymentUrl'), // URL of deployed site (if deployed)
	deploymentId: text('deploymentId'), // Netlify deploy ID
	deployedAt: timestamp('deployedAt'), // When it was deployed
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Export types for TypeScript
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export type Conversation = typeof conversation.$inferSelect;
export type NewConversation = typeof conversation.$inferInsert;

export type AiGeneration = typeof aiGeneration.$inferSelect;
export type NewAiGeneration = typeof aiGeneration.$inferInsert;
