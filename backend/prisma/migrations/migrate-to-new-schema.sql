-- Migration: Old schema to new Fluent schema
-- This migration handles existing data carefully

-- Step 1: Add new columns with nullable first
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sellPrice" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "buyPrice" DOUBLE PRECISION DEFAULT 0;

-- Step 2: Copy data from old columns to new columns
UPDATE "products" SET "sellPrice" = "price" WHERE "sellPrice" IS NULL;
UPDATE "products" SET "buyPrice" = "cost" WHERE "buyPrice" IS NULL;

-- Step 3: Make new columns NOT NULL
ALTER TABLE "products" ALTER COLUMN "sellPrice" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "buyPrice" SET NOT NULL;

-- Step 4: Drop old columns (if they exist)
ALTER TABLE "products" DROP COLUMN IF EXISTS "price";
ALTER TABLE "products" DROP COLUMN IF EXISTS "cost";

-- Step 5: Sales table migration
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "total" DOUBLE PRECISION;

-- Copy netAmount to both subtotal and total
UPDATE "sales" SET "subtotal" = "netAmount" WHERE "subtotal" IS NULL;
UPDATE "sales" SET "total" = "netAmount" WHERE "total" IS NULL;

-- Make them NOT NULL
ALTER TABLE "sales" ALTER COLUMN "subtotal" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "total" SET NOT NULL;

-- Drop old columns
ALTER TABLE "sales" DROP COLUMN IF EXISTS "netAmount";
ALTER TABLE "sales" DROP COLUMN IF EXISTS "totalAmount";

-- Step 6: Rename saleItems to items if needed (relation name change)
-- This is handled by Prisma, no SQL needed

-- Step 7: Add new columns for enhanced features
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isFavorite" BOOLEAN DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" TEXT;

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "loyaltyPoints" INTEGER DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "totalSpent" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS "products_isFavorite_idx" ON "products"("isFavorite");
CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products"("sku");
CREATE INDEX IF NOT EXISTS "users_branchId_idx" ON "users"("branchId");

-- Migration completed successfully!

