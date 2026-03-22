import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function seedFreePlan() {
  const client = new MongoClient(process.env.DB_URI || '');

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const plansCollection = db.collection('plans');

    // Check if free plan already exists
    const existingFreePlan = await plansCollection.findOne({ price: 0, isActive: true });

    if (existingFreePlan) {
      console.log('Free plan already exists:', existingFreePlan.name);
      return;
    }

    // Create free plan
    const freePlan = {
      name: 'Free Plan',
      description: 'Get started with our free plan',
      price: 0,
      currency: 'USD',
      billingCycle: 'monthly',
      isActive: true,
      isDefault: false,
      sortOrder: 0,
      maxProjects: 1,
      maxBrandMessages: 10,
      apiAccess: false,
      exportData: false,
      teamMembers: 1,
      supportLevel: 'community',
      customBranding: false,
      features: {


        analyticsRetention: 7
      },
      metadata: {
        badge: 'FREE',
        popular: false,
        recommended: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await plansCollection.insertOne(freePlan);
    console.log('Free plan created successfully:', result.insertedId);

  } catch (error) {
    console.error('Error seeding free plan:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedFreePlan().catch(console.error);