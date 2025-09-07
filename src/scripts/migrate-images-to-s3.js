/*
  Migration script (JS): Move local public/images assets to S3
  Usage:
    STORAGE_PROVIDER=s3 S3_REGION=us-west-2 S3_BUCKET=newsteps-images \
    node src/scripts/migrate-images-to-s3.js
*/

const { readdir, stat, readFile } = require('fs').promises;
const { join, relative } = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

async function main() {
  const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  if (storageProvider !== 's3') {
    console.log('STORAGE_PROVIDER is not s3. Aborting migration.');
    return;
  }

  const region = process.env.S3_REGION || '';
  const bucket = process.env.S3_BUCKET || '';
  const prefix = process.env.S3_PREFIX || '';
  const publicBase = process.env.S3_PUBLIC_URL || '';

  if (!region || !bucket) {
    console.error('Missing S3 configuration (S3_REGION, S3_BUCKET). Aborting.');
    process.exit(1);
  }

  const s3 = new S3Client({ region });
  const root = join(process.cwd(), 'public', 'images');

  const mapping = [];
  let uploaded = 0;
  for await (const filePath of walk(root)) {
    const st = await stat(filePath);
    if (!st.isFile()) continue;

    const lower = filePath.toLowerCase();
    if (!(lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp'))) {
      continue;
    }

    const body = await readFile(filePath);
    const rel = relative(root, filePath).replace(/\\/g, '/');
    const key = [prefix, rel].filter(Boolean).join('/');

    const contentType = lower.endsWith('.png')
      ? 'image/png'
      : lower.endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    }));

    const url = publicBase
      ? `${publicBase.replace(/\/$/, '')}/${rel}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    mapping.push({ local: `/images/${rel}`, s3Key: key, url });
    uploaded += 1;
    if (uploaded % 10 === 0) console.log(`Uploaded ${uploaded} images...`);
  }

  console.log(`\n✅ Migration complete. Uploaded ${uploaded} images.`);
  console.log('--- Mapping JSON (use for DB updates) ---');
  console.log(JSON.stringify(mapping, null, 2));
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});


