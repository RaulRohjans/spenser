-- Add optional description to categories to help AI classification
ALTER TABLE "category"
    ADD COLUMN IF NOT EXISTS "description" varchar(500);


