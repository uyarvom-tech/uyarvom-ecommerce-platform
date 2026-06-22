const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Manually load .env variables if dotenv is missing
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?([^"'\r\n]*)["']?/);
        if (match) {
          process.env[match[1]] = match[2];
        }
      });
    }
  } catch (e) {
    console.error('Error loading .env.local:', e);
  }
}

loadEnv();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const prisma = new PrismaClient();

const imagesToUpload = [
  'Cookware.png',
  'Dinnerware.png',
  'Bakeware.png',
  'Serveware.png',
  'Artisan_Ceramic_Cooking_Pot.png',
  'Elegant_Dinner_Plate_Set.png',
  'Baking_Dish.png',
  'Ceramic_Platter.png',
  'bowls.png',
  'tea_pot.png'
];

async function uploadFile(fileName) {
  const filePath = path.join(process.cwd(), 'public', fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Skip: ${fileName} not found in public/`);
    return null;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const key = `uploads/${fileName}`;

  console.log(`📤 Uploading ${fileName}...`);
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: fileName.endsWith('.png') ? 'image/png' : 'image/jpeg',
  }));

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  console.log(`✅ Uploaded: ${publicUrl}`);
  return { fileName, publicUrl };
}

async function main() {
  console.log('🚀 Starting R2 Image Migration...');

  const results = [];
  for (const fileName of imagesToUpload) {
    const result = await uploadFile(fileName);
    if (result) results.push(result);
  }

  console.log('🔄 Updating database URLs...');

  for (const { fileName, publicUrl } of results) {
    const localPath = `/${fileName}`;

    // Update Categories
    const catUpdate = await prisma.category.updateMany({
      where: { imageUrl: localPath },
      data: { imageUrl: publicUrl }
    });
    if (catUpdate.count > 0) console.log(`Updated ${catUpdate.count} category images for ${fileName}`);

    // Update Product Images
    const imgUpdate = await prisma.productImage.updateMany({
      where: { imageUrl: localPath },
      data: { imageUrl: publicUrl }
    });
    if (imgUpdate.count > 0) console.log(`Updated ${imgUpdate.count} product images for ${fileName}`);
  }

  console.log('🎉 Done! All local images have been moved to R2 and updated in the database.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
