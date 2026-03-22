const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function updateUserToAdmin() {
  const userEmail = 'michaelyoussif.elias@gmail.com';
  const client = new MongoClient(process.env.DB_URI || '');

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // List all collections to debug
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    const usersCollection = db.collection('users');

    // Find the user first by email
    const user = await usersCollection.findOne({ email: userEmail });

    if (!user) {
      console.log('User not found with email:', userEmail);
      console.log('Trying to find any user...');
      const anyUser = await usersCollection.findOne({});
      console.log('Sample user:', anyUser ? { _id: anyUser._id, email: anyUser.email, role: anyUser.role } : 'No users found');
      return;
    }

    console.log('Current user:', {
      _id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });

    // Update user role to admin
    const result = await usersCollection.updateOne(
      { email: userEmail },
      {
        $set: {
          role: 'admin',
          updatedAt: new Date()
        }
      }
    );

    console.log('Update result:', result.modifiedCount > 0 ? 'SUCCESS' : 'NO CHANGES');

    // Verify the update
    const updatedUser = await usersCollection.findOne({ email: userEmail });
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
