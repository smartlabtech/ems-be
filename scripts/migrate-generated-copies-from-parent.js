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
        
        // Use aggregation pipeline to update all generatedCopies with data from their parent projectCopy
        console.log('📊 Starting bulk update using aggregation pipeline...\n');
        
        // First, let's count how many records need updating
        const needsUpdate = await db.collection('generatedCopies').countDocuments({
            $or: [
                { brandMessageId: { $exists: false } },
                { projectId: { $exists: false } },
                { productId: { $exists: false } }
            ]
        });
        
        console.log(`Found ${needsUpdate} generatedCopies records that need updating\n`);
        
        if (needsUpdate === 0) {
            console.log('✨ No records to update!');
            return;
        }
        
        // Perform the update using aggregation pipeline
        // This will fetch the parent projectCopy and copy its fields
        const result = await db.collection('generatedCopies').aggregate([
            {
                $match: {
                    $or: [
                        { brandMessageId: { $exists: false } },
                        { projectId: { $exists: false } },
                        { productId: { $exists: false } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'projectCopy',
                    localField: 'projectCopyId',
                    foreignField: '_id',
                    as: 'parentCopy'
                }
            },
            {
                $unwind: {
                    path: '$parentCopy',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    projectCopyId: 1,
                    brandMessageId: { $ifNull: ['$brandMessageId', '$parentCopy.brandMessageId'] },
                    projectId: { $ifNull: ['$projectId', '$parentCopy.projectId'] },
                    productId: { $ifNull: ['$productId', '$parentCopy.productId'] },
                    hasParent: { $cond: { if: { $ne: ['$parentCopy', null] }, then: true, else: false } }
                }
            }
        ]).toArray();
        
        console.log(`📝 Processing ${result.length} records...\n`);
        
        let updated = 0;
        let skipped = 0;
        const bulkOps = [];
        
        for (const doc of result) {
            if (doc.hasParent && (doc.brandMessageId || doc.projectId || doc.productId)) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: doc._id },
                        update: {
                            $set: {
                                ...(doc.brandMessageId && { brandMessageId: doc.brandMessageId }),
                                ...(doc.projectId && { projectId: doc.projectId }),
                                ...(doc.productId && { productId: doc.productId }),
                                updatedAt: new Date()
                            }
                        }
                    }
                });
                updated++;
            } else {
                console.log(`⚠️  Skipping ${doc._id} - no parent found or no fields to copy`);
                skipped++;
            }
        }
        
        // Execute bulk update
        if (bulkOps.length > 0) {
            console.log(`\n🚀 Executing bulk update for ${bulkOps.length} records...`);
            const bulkResult = await db.collection('generatedCopies').bulkWrite(bulkOps);
            console.log(`✅ Bulk update completed: ${bulkResult.modifiedCount} records modified\n`);
        }
        
        // Final verification
        const remaining = await db.collection('generatedCopies').countDocuments({
            $or: [
                { brandMessageId: { $exists: false } },
                { projectId: { $exists: false } },
                { productId: { $exists: false } }
            ]
        });
        
        console.log('=' .repeat(60));
        console.log('📈 Migration Summary:');
        console.log('=' .repeat(60));
        console.log(`✅ Successfully updated: ${updated} records`);
        console.log(`⚠️  Skipped (no parent): ${skipped} records`);
        console.log(`📊 Records still missing fields: ${remaining}`);
        
        if (remaining === 0) {
            console.log('\n🎉 Migration completed successfully! All records now have required fields.');
        } else if (remaining === skipped) {
            console.log('\n⚠️  The remaining records have no parent projectCopy to inherit from.');
        }
        
        // Show a sample of updated records
        if (updated > 0) {
            console.log('\n📋 Sample Updated Records:');
            const samples = await db.collection('generatedCopies').find({
                brandMessageId: { $exists: true },
                projectId: { $exists: true },
                productId: { $exists: true }
            }).limit(3).toArray();
            
            samples.forEach(doc => {
                console.log(`  ID: ${doc._id}`);
                console.log(`    brandMessageId: ${doc.brandMessageId}`);
                console.log(`    projectId: ${doc.projectId}`);
                console.log(`    productId: ${doc.productId}`);
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the migration
migrate().catch(console.error);