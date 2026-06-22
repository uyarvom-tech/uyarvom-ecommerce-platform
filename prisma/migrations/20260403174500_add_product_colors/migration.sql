-- CreateTable
CREATE TABLE IF NOT EXISTS "product_colors" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "colorCode" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_colors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_colors_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_colors_productId_colorName_key" UNIQUE ("productId", "colorName")
);

CREATE INDEX IF NOT EXISTS "product_colors_productId_idx" ON "product_colors"("productId");

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "colorId" TEXT;
CREATE INDEX IF NOT EXISTS "product_images_colorId_idx" ON "product_images"("colorId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'product_images_colorId_fkey'
    ) THEN
        ALTER TABLE "product_images"
            ADD CONSTRAINT "product_images_colorId_fkey"
            FOREIGN KEY ("colorId") REFERENCES "product_colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "colorId" TEXT;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "size" TEXT;
CREATE INDEX IF NOT EXISTS "product_variants_colorId_idx" ON "product_variants"("colorId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'product_variants_colorId_fkey'
    ) THEN
        ALTER TABLE "product_variants"
            ADD CONSTRAINT "product_variants_colorId_fkey"
            FOREIGN KEY ("colorId") REFERENCES "product_colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_productId_colorId_size_key"
    ON "product_variants"("productId", "colorId", "size");
