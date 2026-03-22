#!/usr/bin/env node

/**
 * Migration Script: Add brandMessageId, projectId, and productId to generatedCopies records
 * 
 * This script:
 * 1. Fetches all generatedCopies records
 * 2. For each record, looks up the associated projectCopy
 * 3. Gets brandMessageId, projectId, and productId from projectCopy
 * 4. Updates the generatedCopy record with these fields
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrate() {
    const uri = process.env.DB_URI;
    if (!uri) {
        console.error('❌ DB_URI not found in environment');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected successfully\n');
        
        const db = client.db();
        const generatedCopiesCollection = db.collection('generatedCopies');
        const projectCopyCollection = db.collection('projectCopy');
        
        // Count records that need updating
        const totalCount = await generatedCopiesCollection.countDocuments({
            $or: [
                { brandMessageId: { $exists: false } },
                { projectId: { $exists: false } },
                { productId: { $exists: false } }
            ]
        });
        
        console.log(`📊 Found ${totalCount} generatedCopies records that need updating\n`);
        
        if (totalCount === 0) {
            console.log('✨ No records to update! All generatedCopies already have the required fields.');
            return;
        }
        
        let updated = 0;
        let skipped = 0;
        let errors = [];
        let processed = 0;
        
        // Process in batches to avoid memory issues
        const batchSize = 100;
        let hasMore = true;
        
        while (hasMore) {
            // Find records that need updating
            const cursor = generatedCopiesCollection.find({
                $or: [
                    { brandMessageId: { $exists: false } },
                    { projectId: { $exists: false } },
                    { productId: { $exists: false } }
                ]
            }).limit(batchSize);
            
            const batch = await cursor.toArray();
            
            if (batch.length === 0) {
                hasMore = false;
                break;
            }
            
            // Process each record in the batch
            for (const generatedCopy of batch) {
                processed++;
                
                try {
                    // Find associated projectCopy
                    const projectCopy = await projectCopyCollection.findOne({ 
                        _id: generatedCopy.projectCopyId 
                    });
                    
                    if (!projectCopy) {
                        skipped++;
                        errors.push(`No projectCopy found for generatedCopy ${generatedCopy._id}`);
                        console.log(`⚠️  [${processed}/${totalCount}] No projectCopy found for ${generatedCopy._id}`);
                        continue;
                    }
                    
                    // Prepare update fields
                    const updateFields = {};
                    
                    if (!generatedCopy.brandMessageId && projectCopy.brandMessageId) {
                        updateFields.brandMessageId = projectCopy.brandMessageId;
                    }
                    
                    if (!generatedCopy.projectId && projectCopy.projectId) {
                        updateFields.projectId = projectCopy.projectId;
                    }
                    
                    if (!generatedCopy.productId && projectCopy.productId) {
                        updateFields.productId = projectCopy.productId;
                    }
                    
                    // Only update if there are fields to update
                    if (Object.keys(updateFields).length > 0) {
                        await generatedCopiesCollection.updateOne(
                            { _id: generatedCopy._id },
                            { 
                                $set: {
                                    ...updateFields,
                                    updatedAt: new Date()
                                }
                            }
                        );
                        updated++;
                        console.log(`✅ [${processed}/${totalCount}] Updated generatedCopy ${generatedCopy._id}`);
                    } else {
                        skipped++;
                        console.log(`⏭️  [${processed}/${totalCount}] No fields to update for ${generatedCopy._id}`);
                    }
                    
                } catch (error) {
                    errors.push(`Error processing generatedCopy ${generatedCopy._id}: ${error.message}`);
                    console.log(`❌ [${processed}/${totalCount}] Error: ${error.message}`);
                }
            }
            
            // Show progress
            console.log(`\n📈 Progress: ${processed}/${totalCount} processed\n`);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📈 Migration Summary:');
        console.log('='.repeat(60));
        console.log(`✅ Successfully updated: ${updated} records`);
        console.log(`⚠️  Skipped: ${skipped} records`);
        console.log(`📊 Total processed: ${processed} records`);
        
        // Show errors if any
        if (errors.length > 0) {
            console.log(`\n⚠️  Issues encountered: ${errors.length}`);
            errors.slice(0, 5).forEach(err => {
                console.log(`  - ${err}`);
            });
            if (errors.length > 5) {
                console.log(`  ... and ${errors.length - 5} more`);
            }
        }
        
        // Final verification
        const remaining = await generatedCopiesCollection.countDocuments({
            $or: [
                { brandMessageId: { $exists: false } },
                { projectId: { $exists: false } },
                { productId: { $exists: false } }
            ]
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('🔍 Final Verification:');
        console.log('='.repeat(60));
        console.log(`Records still missing fields: ${remaining}`);
        
        if (remaining === 0) {
            console.log('🎉 Migration completed successfully! All records now have required fields.');
        } else {
            console.log('⚠️  Some records still missing fields. Check the errors above.');
        }
        
        // Show a sample of updated records
        if (updated > 0) {
            console.log('\n📋 Sample Updated Records:');
            const samples = await generatedCopiesCollection.find({
                brandMessageId: { $exists: true },
                projectId: { $exists: true },
                productId: { $exists: true }
            }).limit(3).toArray();
            
            samples.forEach(doc => {
                console.log(`\n  GeneratedCopy: ${doc._id}`);
                console.log(`    brandMessageId: ${doc.brandMessageId}`);
                console.log(`    projectId: ${doc.projectId}`);
                console.log(`    productId: ${doc.productId}`);
                console.log(`    platform: ${doc.platform} | type: ${doc.copyType}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the migration
migrate().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});