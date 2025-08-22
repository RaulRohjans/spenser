ALTER TABLE "category" ADD COLUMN "description" varchar(500);--> statement-breakpoint
ALTER TABLE "global_settings" ADD COLUMN "model" varchar(100);--> statement-breakpoint
ALTER TABLE "global_settings" ADD COLUMN "token" varchar(150);--> statement-breakpoint
ALTER TABLE "global_settings" DROP COLUMN "user";--> statement-breakpoint
ALTER TABLE "global_settings" DROP COLUMN "gpt_model";--> statement-breakpoint
ALTER TABLE "global_settings" DROP COLUMN "gpt_token";--> statement-breakpoint
ALTER TABLE "global_settings" DROP COLUMN "ollama_model";