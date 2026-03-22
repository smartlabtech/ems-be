const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrate() {
    const uri = process.env.DB_URI;
    if (!uri) {
        console.error('DB_URI not found in environment');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    
    try {
        console.log('🔗 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected successfully');
        
        const db = client.db();
        const projectCopyCollection = db.collection('projectCopy');
        const brandMessageCollection = db.collection('brandMessage');
        
        // Find projectCopy records without productId
        const cursor = projectCopyCollection.find({ productId: { $exists: false } });
        const totalCount = await projectCopyCollection.countDocuments({ productId: { $exists: false } });
        
        console.log(`📊 Found ${totalCount} projectCopy records without productId`);
        
        if (totalCount === 0) {
            console.log('✨ No records to update!');
            return;
        }
        
        let updated = 0;
        let skipped = 0;
        
        // Process each record
        while (await cursor.hasNext()) {
            const projectCopy = await cursor.next();
            
            // Find associated brandMessage
            const brandMessage = await brandMessageCollection.findOne({ 
                _id: projectCopy.brandMessageId 
            });
            
            if (brandMessage && brandMessage.productId) {
                // Update projectCopy with productId
                await projectCopyCollection.updateOne(
                    { _id: projectCopy._id },
                    { 
                        $set: { 
                            productId: brandMessage.productId,
                            updatedAt: new Date()
                        }
                    }
                );
                updated++;
                console.log(`✅ Updated projectCopy ${projectCopy._id}`);
            } else {
                skipped++;
                if (!brandMessage) {
                    console.log(`⚠️  No brandMessage found for projectCopy ${projectCopy._id}`);
                } else {
                    console.log(`⚠️  No productId in brandMessage ${brandMessage._id}`);
                }
            }
        }
        
        console.log('\n📈 Migration Summary:');
        console.log(`✅ Updated: ${updated} records`);
        console.log(`⚠️  Skipped: ${skipped} records`);
        
        // Final verification
        const remaining = await projectCopyCollection.countDocuments({ 
            productId: { $exists: false } 
        });
        console.log(`📊 Records still without productId: ${remaining}`);
        
        if (remaining === 0) {
            console.log('🎉 Migration completed successfully!');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

migrate().catch(console.error);