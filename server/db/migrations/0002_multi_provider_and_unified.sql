ALTER TABLE "global_settings"
    ADD COLUMN IF NOT EXISTS "model" varchar(100),
    ADD COLUMN IF NOT EXISTS "token" varchar(150),
    ADD COLUMN IF NOT EXISTS "ollama_url" varchar(150);

-- Drop legacy columns if they exist
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'gpt_model') THEN
        ALTER TABLE "global_settings" DROP COLUMN IF EXISTS "gpt_model";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'gpt_token') THEN
        ALTER TABLE "global_settings" DROP COLUMN IF EXISTS "gpt_token";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'anthropic_model') THEN
        ALTER TABLE "global_settings" DROP COLUMN IF EXISTS "anthropic_model";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'anthropic_token') THEN
        ALTER TABLE "global_settings" DROP COLUMN IF EXISTS "anthropic_token";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'google_model') THEN
        ALTER TABLE "global_settings" DROP COLUMN IF EXISTS "google_model";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'google_token') THEN
        ALTER TABLE "global_settings" DROP COLUMN IF EXISTS "google_token";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_settings' AND column_name = 'ollama_model') THEN
        ALTER TABLE "global_settings" DROP COLUMN IF EXISTS "ollama_model";
    END IF;
END $$;


