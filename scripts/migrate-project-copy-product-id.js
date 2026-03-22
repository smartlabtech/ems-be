#!/usr/bin/env node

/**
 * Migration Script: Add productId to existing projectCopy records
 * 
 * This script:
 * 1. Fetches all projectCopy records
 * 2. For each record, looks up the brandMessage to get productId
 * 3. Updates the projectCopy record with the productId
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string - adjust if needed
const MONGODB_URI = process.env.DB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Define schemas (minimal, just what we need)
const projectCopySchema = new mongoose.Schema({
    brandMessageId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    // other fields exist but we don't need to define them for this migration
}, { collection: 'projectCopy', strict: false });

const brandMessageSchema = new mongoose.Schema({
    productId: mongoose.Schema.Types.ObjectId,
    productName: String,
    // other fields exist but we don't need to define them for this migration
}, { collection: 'brandMessage', strict: false });

async function migrate() {
    try {
        console.log('🚀 Starting migration: Adding productId to projectCopy records');
        console.log(`📦 Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Create models
        const ProjectCopy = mongoose.model('ProjectCopy', projectCopySchema);
        const BrandMessage = mongoose.model('BrandMessage', brandMessageSchema);

        // Get all projectCopy records that don't have productId yet
        const projectCopies = await ProjectCopy.find({ 
            productId: { $exists: false }
        }).lean();

        console.log(`📊 Found ${projectCopies.length} projectCopy records without productId`);

        if (projectCopies.length === 0) {
            console.log('✨ No records to update. Migration complete!');
            await mongoose.connection.close();
            return;
        }

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Process each projectCopy record
        for (const projectCopy of projectCopies) {
            try {
                // Find the associated brandMessage
                const brandMessage = await BrandMessage.findById(projectCopy.brandMessageId).lean();
                
                if (!brandMessage) {
                    console.log(`⚠️  No brandMessage found for projectCopy ${projectCopy._id}`);
                    skippedCount++;
                    continue;
                }

                if (!brandMessage.productId) {
                    console.log(`⚠️  BrandMessage ${brandMessage._id} has no productId for projectCopy ${projectCopy._id}`);
                    skippedCount++;
                    continue;
                }

                // Update the projectCopy with productId
                await ProjectCopy.updateOne(
                    { _id: projectCopy._id },
                    { 
                        $set: { 
                            productId: brandMessage.productId,
                            updatedAt: new Date()
                        }
                    }
                );

                updatedCount++;
                console.log(`✅ Updated projectCopy ${projectCopy._id} with productId ${brandMessage.productId}`);

            } catch (error) {
                console.error(`❌ Error processing projectCopy ${projectCopy._id}:`, error.message);
                errorCount++;
            }
        }

        // Print summary
        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ Successfully updated: ${updatedCount} records`);
        console.log(`   ⚠️  Skipped (no productId in brandMessage): ${skippedCount} records`);
        console.log(`   ❌ Errors: ${errorCount} records`);
        console.log(`   📊 Total processed: ${projectCopies.length} records`);

        // Verify the migration
        const remainingWithoutProductId = await ProjectCopy.countDocuments({
            productId: { $exists: false }
        });
        console.log(`\n🔍 Verification: ${remainingWithoutProductId} records still without productId`);

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
migrate().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});