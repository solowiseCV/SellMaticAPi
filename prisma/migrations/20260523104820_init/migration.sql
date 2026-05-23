-- CreateTable
CREATE TABLE "Business" (
    "id" SERIAL NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "phoneNumberId" TEXT,
    "wabaId" TEXT,
    "accessToken" TEXT,
    "location" TEXT,
    "deliveryInfo" TEXT,
    "paymentInfo" TEXT,
    "businessDescription" TEXT,
    "products" JSONB NOT NULL DEFAULT '[]',
    "botActive" BOOLEAN NOT NULL DEFAULT true,
    "botPersonality" TEXT NOT NULL DEFAULT 'friendly and professional',
    "plan" TEXT NOT NULL DEFAULT 'free_trial',
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_ownerEmail_key" ON "Business"("ownerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Business_phoneNumberId_key" ON "Business"("phoneNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_businessId_customerPhone_key" ON "Conversation"("businessId", "customerPhone");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
