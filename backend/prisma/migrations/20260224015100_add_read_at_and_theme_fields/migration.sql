-- Add read_at field to notification_logs table
ALTER TABLE "notification_logs" ADD COLUMN "read_at" TIMESTAMP(3);

-- Add theme field to user_profiles table
ALTER TABLE "user_profiles" ADD COLUMN "theme" TEXT DEFAULT 'light';

-- Create index on read_at for better query performance
CREATE INDEX "notification_logs_read_at_idx" ON "notification_logs"("read_at");

-- Create index on theme for filtering
CREATE INDEX "user_profiles_theme_idx" ON "user_profiles"("theme");
