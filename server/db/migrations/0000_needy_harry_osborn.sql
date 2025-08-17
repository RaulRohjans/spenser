CREATE TABLE "budget" (
	"id" serial PRIMARY KEY NOT NULL,
	"user" integer NOT NULL,
	"category" integer,
	"name" varchar(150),
	"value" numeric(12, 2) NOT NULL,
	"period" varchar(100) NOT NULL,
	"order" integer NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"user" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"icon" varchar(50),
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(5) NOT NULL,
	"placement" varchar(6) NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user" integer NOT NULL,
	"importer_provider" varchar(50) NOT NULL,
	"gpt_model" varchar(100),
	"gpt_token" varchar(150),
	"ollama_model" varchar(100),
	"ollama_url" varchar(150)
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"user" integer NOT NULL,
	"category" integer NOT NULL,
	"name" varchar(150),
	"value" numeric(12, 2) NOT NULL,
	"date" timestamp NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user" integer NOT NULL,
	"currency" integer NOT NULL,
	CONSTRAINT "user_preferences_user_unique" UNIQUE("user")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"email" varchar(320) NOT NULL,
	"avatar" varchar(50),
	"is_admin" boolean DEFAULT false NOT NULL,
	"password" varchar(72) NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL
);
