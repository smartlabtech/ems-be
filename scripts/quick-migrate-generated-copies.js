const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function migrate() {
    const uri = process.env.DB_URI;
    if (!uri) {
        console.error('DB_URI not found');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db();
        
        // Get all generatedCopies that need updating
        const generatedCopies = await db.collection('generatedCopies').find({
            $or: [
                { brandMessageId: { $exists: false } },
                { projectId: { $exists: false } },
                { productId: { $exists: false } }
            ]
        }).toArray();
        
        console.log(`Found ${generatedCopies.length} records to update`);
        
        let updated = 0;
        
        // Group by projectCopyId to minimize lookups
        const projectCopyIds = [...new Set(generatedCopies.map(gc => gc.projectCopyId))];
        
        // Fetch all relevant projectCopies at once
        const projectCopies = await db.collection('projectCopy').find({
            _id: { $in: projectCopyIds }
        }).toArray();
        
        // Create a map for quick lookup
        const projectCopyMap = new Map();
        projectCopies.forEach(pc => {
            projectCopyMap.set(pc._id.toString(), pc);
        });
        
        // Update each generatedCopy
        for (const gc of generatedCopies) {
            const projectCopy = projectCopyMap.get(gc.projectCopyId.toString());
            
            if (projectCopy) {
                await db.collection('generatedCopies').updateOne(
                    { _id: gc._id },
                    { 
                        $set: {
                            brandMessageId: projectCopy.brandMessageId,
                            projectId: projectCopy.projectId,
                            productId: projectCopy.productId,
                            updatedAt: new Date()
                        }
                    }
                );
                updated++;
                console.log(`Updated ${gc._id}`);
            }
        }
        
        console.log(`\nUpdated ${updated} records`);
        
        // Check remaining
        const remaining = await db.collection('generatedCopies').countDocuments({
            $or: [
                { brandMessageId: { $exists: false } },
                { projectId: { $exists: false } },
                { productId: { $exists: false } }
            ]
        });
        
        console.log(`Remaining without fields: ${remaining}`);
        
    } finally {
        await client.close();
    }
}

migrate().catch(console.error);