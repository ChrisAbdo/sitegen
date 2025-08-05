ALTER TABLE "ai_generation" ADD COLUMN "deploymentStatus" text DEFAULT 'not_deployed' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_generation" ADD COLUMN "deploymentUrl" text;--> statement-breakpoint
ALTER TABLE "ai_generation" ADD COLUMN "deploymentId" text;--> statement-breakpoint
ALTER TABLE "ai_generation" ADD COLUMN "deployedAt" timestamp;