import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateUserToAdmin() {
  const userId = '65d74f994d1c4253a20e8362';
  const client = new MongoClient(process.env.DB_URI || '');

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find the user first
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      console.log('User not found with ID:', userId);
      return;
    }

    console.log('Current user:', {
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });

    // Update user role to admin
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: 'admin',
          updatedAt: new Date()
        }
      }
    );

    console.log('Update result:', result.modifiedCount > 0 ? 'SUCCESS' : 'NO CHANGES');

    // Verify the update
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    console.log('Updated user role:', updatedUser?.role);

  } catch (error) {
    console.error('Error updating user to admin:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the update function
updateUserToAdmin().catch(console.error);
