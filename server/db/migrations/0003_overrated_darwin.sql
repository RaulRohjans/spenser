CREATE TABLE "ai_model" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(150) NOT NULL,
	"validator_model" varchar(150),
	"token" varchar(200),
	"ollama_url" varchar(200),
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "global_settings" ADD COLUMN "ai_model" integer;--> statement-breakpoint
ALTER TABLE "global_settings" DROP COLUMN "importer_provider";--> statement-breakpoint
ALTER TABLE "global_settings" DROP COLUMN "model";--> statement-breakpoint
ALTER TABLE "global_settings" DROP COLUMN "token";--> statement-breakpoint
ALTER TABLE "global_settings" DROP COLUMN "ollama_url";