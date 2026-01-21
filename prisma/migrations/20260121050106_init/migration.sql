-- CreateTable
CREATE TABLE "outlook_accounts" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "last_synced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outlook_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outlook_accounts_user_email_key" ON "outlook_accounts"("user_email");
