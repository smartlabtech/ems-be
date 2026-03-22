const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://shippinglabel:SXrOZXrUBGpMMFxq@freecluster.xpxig.mongodb.net/marketing?retryWrites=true&w=majority';
const dbName = 'marketing';

const sessions = [
  {
    title: "Mastering Brand Messaging for Startups",
    description: "Learn how to craft compelling brand messages that resonate with your target audience",
    agenda: ["Understanding your target audience", "Crafting your value proposition", "Testing your message"],
    tags: ["MARKETING", "BRAND_MESSAGE"],
    level: "INTERMEDIATE",
    sessionType: "ONLINE",
    sessionLanguage: "ENGLISH",
    instructor: "Sarah Ahmed",
    estimatedDuration: 90,
    order: 1,
    status: "DRAFT",
    registrationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Copywriting Essentials for Beginners",
    description: "Master the basics of persuasive copywriting to boost your marketing efforts",
    agenda: ["Copywriting fundamentals", "Writing compelling headlines", "Call-to-action techniques"],
    tags: ["COPYWRITING", "MARKETING"],
    level: "BEGINNER",
    sessionType: "ONLINE",
    sessionLanguage: "ARABIC",
    instructor: "Ahmad Hassan",
    estimatedDuration: 60,
    order: 2,
    status: "DRAFT",
    registrationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Advanced SEO Strategies",
    description: "Take your SEO knowledge to the next level with advanced techniques and best practices",
    agenda: ["Technical SEO deep dive", "Link building strategies", "Content optimization", "Analytics and reporting"],
    tags: ["SEO", "MARKETING"],
    level: "ADVANCED",
    sessionType: "HYBRID",
    sessionLanguage: "BOTH",
    instructor: "Maria Lopez",
    estimatedDuration: 120,
    order: 3,
    status: "DRAFT",
    registrationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Social Media Marketing Workshop",
    description: "Learn how to create engaging social media content that drives results",
    agenda: ["Platform selection", "Content calendar planning", "Engagement strategies", "Performance tracking"],
    tags: ["SOCIAL_MEDIA", "MARKETING"],
    level: "INTERMEDIATE",
    sessionType: "OFFLINE",
    sessionLanguage: "ARABIC",
    instructor: "Fatima Al-Said",
    estimatedDuration: 90,
    order: 4,
    status: "DRAFT",
    registrationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Logo Design Fundamentals",
    description: "Create memorable logos that represent your brand identity",
    agenda: ["Design principles", "Color theory", "Typography basics", "Logo sketching"],
    tags: ["LOGO", "CREATIVE", "BRANDING"],
    level: "BEGINNER",
    sessionType: "ONLINE",
    sessionLanguage: "ENGLISH",
    instructor: "David Chen",
    estimatedDuration: 75,
    order: 5,
    status: "DRAFT",
    registrationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Email Marketing Mastery",
    description: "Build effective email campaigns that convert subscribers into customers",
    agenda: ["List building", "Email copywriting", "Automation workflows", "A/B testing"],
    tags: ["EMAIL_MARKETING", "MARKETING"],
    level: "ALL_LEVELS",
    sessionType: "ONLINE",
    sessionLanguage: "BOTH",
    instructor: "Jennifer Smith",
    estimatedDuration: 90,
    order: 6,
    status: "DRAFT",
    registrationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Strategic Pricing for Startups",
    description: "Learn how to price your products and services for maximum profitability",
    agenda: ["Pricing psychology", "Competitive analysis", "Value-based pricing", "Pricing models"],
    tags: ["PRICING", "STRATEGY"],
    level: "ADVANCED",
    sessionType: "OFFLINE",
    sessionLanguage: "ENGLISH",
    instructor: "Robert Williams",
    estimatedDuration: 120,
    order: 7,
    status: "DRAFT",
    registrationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Complete Brand Identity Development",
    description: "Build a comprehensive brand identity from strategy to visual design",
    agenda: ["Brand positioning", "Visual identity system", "Brand guidelines", "Implementation strategy"],
    tags: ["BRANDING", "STRATEGY", "CREATIVE"],
    level: "INTERMEDIATE",
    sessionType: "HYBRID",
    sessionLanguage: "ARABIC",
    instructor: "Layla Mansour",
    estimatedDuration: 150,
    order: 8,
    status: "DRAFT",
    registrationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function createSessions() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('sessions');

    const result = await collection.insertMany(sessions);
    console.log(`Successfully created ${result.insertedCount} sessions`);

    // Display created sessions
    const createdSessions = await collection.find({}).sort({ order: 1 }).toArray();
    console.log('\nCreated sessions:');
    createdSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title} (${session.sessionLanguage}, ${session.sessionType}, ${session.level})`);
    });

  } catch (error) {
    console.error('Error creating sessions:', error);
  } finally {
    await client.close();
  }
}

createSessions();
