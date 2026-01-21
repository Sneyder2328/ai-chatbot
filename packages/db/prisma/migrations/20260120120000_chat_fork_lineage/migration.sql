-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "forked_from_chat_id" UUID;
ALTER TABLE "chats" ADD COLUMN     "forked_from_message_id" UUID;

-- CreateIndex
CREATE INDEX "chats_user_id_forked_from_chat_id_idx" ON "chats"("user_id", "forked_from_chat_id");

