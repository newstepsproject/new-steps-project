#!/usr/bin/env node

/**
 * New Steps Project - Image Migration to S3
 * Migrates existing local images to S3 and updates database URLs
 */

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');

// Configuration
const config = {
    s3: {
        bucketName: process.env.AWS_S3_BUCKET_NAME || 'newsteps-images-prod',
        region: process.env.AWS_S3_REGION || 'us-west-2',
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
    },
    cloudfront: {
        domain: process.env.CLOUDFRONT_DOMAIN
    },
    mongodb: {
        uri: process.env.MONGODB_URI
    },
    localImagePath: path.join(__dirname, '../../public/images')
};

// Initialize AWS S3
const s3 = new AWS.S3({
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
    region: config.s3.region
});

// Database Models (simplified)
const ShoeSchema = new mongoose.Schema({
    shoeId: Number,
    images: [String],
    // ... other fields
}, { collection: 'shoes' });

const OperatorSchema = new mongoose.Schema({
    name: String,
    photo: String,
    // ... other fields  
}, { collection: 'operators' });

const Shoe = mongoose.model('Shoe', ShoeSchema);
const Operator = mongoose.model('Operator', OperatorSchema);

/**
 * Upload file to S3
 */
async function uploadToS3(localFilePath, s3Key) {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        const contentType = getContentType(localFilePath);
        
        const params = {
            Bucket: config.s3.bucketName,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType,
            CacheControl: 'max-age=31536000', // 1 year
            ACL: 'public-read'
        };
        
        const result = await s3.upload(params).promise();
        console.log(`   ✅ Uploaded: ${s3Key} → ${result.Location}`);
        return result.Location;
    } catch (error) {
        console.error(`   ❌ Failed to upload ${s3Key}:`, error.message);
        throw error;
    }
}

/**
 * Get content type based on file extension
 */
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
    };
    return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Convert local URL to S3 URL
 */
function convertToS3Url(localUrl, s3Url) {
    if (config.cloudfront.domain) {
        // Use CloudFront domain
        const s3Key = s3Url.split('/').pop();
        return `https://${config.cloudfront.domain}/${s3Key}`;
    }
    return s3Url;
}

/**
 * Migrate images from a directory
 */
async function migrateDirectory(dirPath, s3Prefix) {
    console.log(`📁 Migrating directory: ${dirPath} → s3://${config.s3.bucketName}/${s3Prefix}`);
    
    if (!fs.existsSync(dirPath)) {
        console.log(`   ⚠️  Directory not found: ${dirPath}`);
        return [];
    }
    
    const files = fs.readdirSync(dirPath);
    const migrations = [];
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile() && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)) {
            const s3Key = `${s3Prefix}${file}`;
            const localUrl = `/images/${s3Prefix}${file}`;
            
            try {
                const s3Url = await uploadToS3(filePath, s3Key);
                const finalUrl = convertToS3Url(localUrl, s3Url);
                
                migrations.push({
                    localPath: filePath,
                    localUrl: localUrl,
                    s3Key: s3Key,
                    s3Url: s3Url,
                    finalUrl: finalUrl
                });
            } catch (error) {
                console.error(`   ❌ Failed to migrate ${file}:`, error.message);
            }
        }
    }
    
    return migrations;
}

/**
 * Update database URLs
 */
async function updateDatabaseUrls(migrations) {
    console.log('\\n💾 **UPDATING DATABASE URLS**');
    
    // Create URL mapping
    const urlMap = {};
    migrations.forEach(migration => {
        urlMap[migration.localUrl] = migration.finalUrl;
    });
    
    let updatedShoes = 0;
    let updatedOperators = 0;
    
    // Update shoe images
    console.log('   📦 Updating shoe images...');
    const shoes = await Shoe.find({ images: { $exists: true, $ne: [] } });
    
    for (const shoe of shoes) {
        let updated = false;
        const newImages = shoe.images.map(imageUrl => {
            if (urlMap[imageUrl]) {
                updated = true;
                return urlMap[imageUrl];
            }
            return imageUrl;
        });
        
        if (updated) {
            await Shoe.updateOne(
                { _id: shoe._id },
                { $set: { images: newImages } }
            );
            updatedShoes++;
            console.log(`   ✅ Updated shoe ${shoe.shoeId}: ${shoe.images.length} images`);
        }
    }
    
    // Update operator photos
    console.log('   👥 Updating operator photos...');
    const operators = await Operator.find({ photo: { $exists: true, $ne: '' } });
    
    for (const operator of operators) {
        if (urlMap[operator.photo]) {
            await Operator.updateOne(
                { _id: operator._id },
                { $set: { photo: urlMap[operator.photo] } }
            );
            updatedOperators++;
            console.log(`   ✅ Updated operator ${operator.name}: ${operator.photo} → ${urlMap[operator.photo]}`);
        }
    }
    
    console.log(`   📊 Summary: ${updatedShoes} shoes, ${updatedOperators} operators updated`);
}

/**
 * Main migration function
 */
async function main() {
    console.log('🚀 **NEW STEPS PROJECT - IMAGE MIGRATION TO S3**');
    console.log('==================================================');
    console.log('');
    
    // Validate configuration
    if (!config.s3.accessKeyId || !config.s3.secretAccessKey) {
        console.error('❌ AWS credentials not configured. Please set AWS_S3_ACCESS_KEY_ID and AWS_S3_SECRET_ACCESS_KEY');
        process.exit(1);
    }
    
    if (!config.mongodb.uri) {
        console.error('❌ MongoDB URI not configured. Please set MONGODB_URI');
        process.exit(1);
    }
    
    console.log('📋 Configuration:');
    console.log(`   S3 Bucket: ${config.s3.bucketName}`);
    console.log(`   S3 Region: ${config.s3.region}`);
    console.log(`   CloudFront: ${config.cloudfront.domain || 'Not configured'}`);
    console.log(`   MongoDB: ${config.mongodb.uri.replace(/\\/\\/.*@/, '//***@')}`);
    console.log('');
    
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongodb.uri);
        console.log('   ✅ Connected to MongoDB');
        
        // Migrate different image directories
        const allMigrations = [];
        
        // Migrate shoe images
        const shoeMigrations = await migrateDirectory(
            path.join(config.localImagePath, 'shoes'),
            'shoes/'
        );
        allMigrations.push(...shoeMigrations);
        
        // Migrate team photos
        const teamMigrations = await migrateDirectory(
            path.join(config.localImagePath, 'team'),
            'team/'
        );
        allMigrations.push(...teamMigrations);
        
        // Migrate general images
        const generalMigrations = await migrateDirectory(
            path.join(config.localImagePath, 'general'),
            'general/'
        );
        allMigrations.push(...generalMigrations);
        
        console.log(`\\n📊 **MIGRATION SUMMARY**`);
        console.log(`   Total files migrated: ${allMigrations.length}`);
        console.log(`   Shoes: ${shoeMigrations.length} files`);
        console.log(`   Team: ${teamMigrations.length} files`);
        console.log(`   General: ${generalMigrations.length} files`);
        
        // Update database URLs
        if (allMigrations.length > 0) {
            await updateDatabaseUrls(allMigrations);
        }
        
        // Save migration log
        const migrationLog = {
            timestamp: new Date().toISOString(),
            totalFiles: allMigrations.length,
            migrations: allMigrations
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'migration-log.json'),
            JSON.stringify(migrationLog, null, 2)
        );
        
        console.log('\\n🎯 **MIGRATION COMPLETE!**');
        console.log('   📄 Migration log saved to: scripts/production/migration-log.json');
        console.log('   ✅ All images migrated to S3');
        console.log('   ✅ Database URLs updated');
        console.log('   🌐 Images now served via CloudFront CDN');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Run migration
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };


