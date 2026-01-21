-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "pinned_at" TIMESTAMPTZ;
ALTER TABLE "chats" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'STREAMING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "provider_id" TEXT;
ALTER TABLE "messages" ADD COLUMN     "model_id" TEXT;
ALTER TABLE "messages" ADD COLUMN     "status" "MessageStatus";
ALTER TABLE "messages" ADD COLUMN     "error_message" TEXT;

-- CreateIndex
CREATE INDEX "chats_user_id_pinned_at_idx" ON "chats"("user_id", "pinned_at");

-- CreateIndex
CREATE INDEX "chats_user_id_last_message_at_idx" ON "chats"("user_id", "last_message_at");

-- CreateIndex
CREATE INDEX "chats_user_id_deleted_at_idx" ON "chats"("user_id", "deleted_at");

