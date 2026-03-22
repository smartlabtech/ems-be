// MongoDB Seed Script for Community 2zpoint Test Data
// Run with: mongosh "mongodb+srv://shippinglabel:SXrOZXrUBGpMMFxq@freecluster.xpxig.mongodb.net/marketing?retryWrites=true&w=majority" seed-test-data.js

const { ObjectId } = require('mongodb');

// Helper function to create ObjectId
function createObjectId(id) {
  return id ? new ObjectId(id) : new ObjectId();
}

// Get or create a test user ID (you should replace this with a real user ID from your database)
const testUserId = new ObjectId('68701ad3bf31357254 95e1a6'); // Your admin user ID from JWT

print('Starting seed process...');
print('Using database: marketing');

// Use the marketing database
db = db.getSiblingDB('marketing');

// =======================
// 1. CREATE TAGS
// =======================
print('\n1. Creating Tags...');

const tags = [
  {
    _id: createObjectId(),
    name: { en: 'JavaScript', ar: 'جافا سكريبت' },
    type: 'public',
    creator: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    name: { en: 'NestJS', ar: 'نيست جي إس' },
    type: 'public',
    creator: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    name: { en: 'MongoDB', ar: 'مونجو دي بي' },
    type: 'public',
    creator: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    name: { en: 'React', ar: 'رياكت' },
    type: 'public',
    creator: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    name: { en: 'TypeScript', ar: 'تايب سكريبت' },
    type: 'public',
    creator: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    name: { en: 'Backend', ar: 'الواجهة الخلفية' },
    type: 'private',
    creator: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    name: { en: 'Frontend', ar: 'الواجهة الأمامية' },
    type: 'private',
    creator: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  const tagResult = db.tag.insertMany(tags);
  print(`✓ Inserted ${tagResult.insertedIds.length} tags`);
} catch (err) {
  print(`✗ Error inserting tags: ${err.message}`);
}

// Save tag IDs for later use
const jsTagId = tags[0]._id;
const nestTagId = tags[1]._id;
const mongoTagId = tags[2]._id;
const reactTagId = tags[3]._id;
const tsTagId = tags[4]._id;
const backendTagId = tags[5]._id;
const frontendTagId = tags[6]._id;

// =======================
// 2. CREATE ARTICLES
// =======================
print('\n2. Creating Articles...');

const articles = [
  {
    _id: createObjectId(),
    title: {
      en: 'Getting Started with NestJS',
      ar: 'البدء مع NestJS'
    },
    content: {
      en: '# Introduction to NestJS\n\nNestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications. It uses modern JavaScript, is built with TypeScript and combines elements of OOP, FP, and FRP.\n\n## Key Features\n- Modular architecture\n- Dependency injection\n- TypeScript support\n- Express/Fastify compatibility',
      ar: '# مقدمة إلى NestJS\n\nNestJS هو إطار عمل Node.js تقدمي لبناء تطبيقات من جانب الخادم فعالة وموثوقة وقابلة للتوسع. يستخدم JavaScript الحديثة، ومبني بـ TypeScript ويجمع عناصر من OOP و FP و FRP.\n\n## الميزات الرئيسية\n- بنية معمارية نمطية\n- حقن التبعية\n- دعم TypeScript\n- التوافق مع Express/Fastify'
    },
    summary: {
      en: 'Learn the basics of NestJS framework and how to build scalable server-side applications.',
      ar: 'تعلم أساسيات إطار عمل NestJS وكيفية بناء تطبيقات قابلة للتوسع من جانب الخادم.'
    },
    coverImage: 'https://nestjs.com/img/logo-small.svg',
    authorId: testUserId,
    tags: [nestTagId, tsTagId, backendTagId],
    status: 'published',
    visibility: 'public',
    likes: 42,
    views: 320,
    category: 'development',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    title: {
      en: 'MongoDB Best Practices',
      ar: 'أفضل ممارسات MongoDB'
    },
    content: {
      en: '# MongoDB Best Practices\n\nMongoDB is a popular NoSQL database. Here are some best practices:\n\n## Schema Design\n- Embed vs Reference\n- Indexing strategies\n- Data modeling patterns\n\n## Performance\n- Use indexes wisely\n- Avoid large documents\n- Implement pagination',
      ar: '# أفضل ممارسات MongoDB\n\nMongoDB هي قاعدة بيانات NoSQL شهيرة. إليك بعض أفضل الممارسات:\n\n## تصميم المخطط\n- التضمين مقابل المرجع\n- استراتيجيات الفهرسة\n- أنماط نمذجة البيانات\n\n## الأداء\n- استخدم الفهارس بحكمة\n- تجنب المستندات الكبيرة\n- تنفيذ ترقيم الصفحات'
    },
    summary: {
      en: 'Essential MongoDB best practices for designing efficient and scalable databases.',
      ar: 'أفضل ممارسات MongoDB الأساسية لتصميم قواعد بيانات فعالة وقابلة للتوسع.'
    },
    coverImage: 'https://www.mongodb.com/assets/images/global/favicon.ico',
    authorId: testUserId,
    tags: [mongoTagId, backendTagId],
    status: 'published',
    visibility: 'public',
    likes: 28,
    views: 215,
    category: 'development',
    order: 2,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    _id: createObjectId(),
    title: {
      en: 'React Hooks Deep Dive',
      ar: 'الغوص العميق في React Hooks'
    },
    content: {
      en: '# React Hooks Deep Dive\n\nReact Hooks revolutionized how we write React components. Let\'s explore:\n\n## Common Hooks\n- useState\n- useEffect\n- useContext\n- useReducer\n\n## Custom Hooks\nCreating reusable logic with custom hooks.',
      ar: '# الغوص العميق في React Hooks\n\nأحدثت React Hooks ثورة في طريقة كتابة مكونات React. دعونا نستكشف:\n\n## الخطافات الشائعة\n- useState\n- useEffect\n- useContext\n- useReducer\n\n## الخطافات المخصصة\nإنشاء منطق قابل لإعادة الاستخدام باستخدام الخطافات المخصصة.'
    },
    summary: {
      en: 'A comprehensive guide to React Hooks and how to use them effectively in your applications.',
      ar: 'دليل شامل لـ React Hooks وكيفية استخدامها بفعالية في تطبيقاتك.'
    },
    coverImage: 'https://react.dev/favicon.ico',
    authorId: testUserId,
    tags: [reactTagId, jsTagId, frontendTagId],
    status: 'draft',
    visibility: 'public',
    likes: 15,
    views: 98,
    category: 'development',
    order: 3,
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000)
  }
];

try {
  const articleResult = db.article.insertMany(articles);
  print(`✓ Inserted ${articleResult.insertedIds.length} articles`);
} catch (err) {
  print(`✗ Error inserting articles: ${err.message}`);
}

// =======================
// 3. CREATE QUOTES
// =======================
print('\n3. Creating Quotes...');

const quotes = [
  {
    _id: createObjectId(),
    quote: {
      en: 'Code is like humor. When you have to explain it, it\'s bad.',
      ar: 'الكود مثل الفكاهة. عندما تضطر إلى شرحه، يكون سيئًا.'
    },
    author: {
      en: 'Cory House',
      ar: 'كوري هاوس'
    },
    status: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    quote: {
      en: 'First, solve the problem. Then, write the code.',
      ar: 'أولاً، حل المشكلة. ثم، اكتب الكود.'
    },
    author: {
      en: 'John Johnson',
      ar: 'جون جونسون'
    },
    status: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    quote: {
      en: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
      ar: 'يمكن لأي أحمق كتابة كود يمكن للكمبيوتر فهمه. المبرمجون الجيدون يكتبون كودًا يمكن للبشر فهمه.'
    },
    author: {
      en: 'Martin Fowler',
      ar: 'مارتن فاولر'
    },
    status: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  const quoteResult = db.quote.insertMany(quotes);
  print(`✓ Inserted ${quoteResult.insertedIds.length} quotes`);
} catch (err) {
  print(`✗ Error inserting quotes: ${err.message}`);
}

// =======================
// 4. CREATE SIDE NOTES
// =======================
print('\n4. Creating Side Notes...');

const sideNotes = [
  {
    _id: createObjectId(),
    title: {
      en: 'TypeScript Tips',
      ar: 'نصائح TypeScript'
    },
    description: {
      en: 'Always use strict mode and enable all type checking options for better code quality.',
      ar: 'استخدم دائمًا الوضع الصارم وقم بتمكين جميع خيارات فحص النوع للحصول على جودة كود أفضل.'
    },
    status: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    title: {
      en: 'Database Indexing',
      ar: 'فهرسة قاعدة البيانات'
    },
    description: {
      en: 'Proper indexing can improve query performance by up to 1000x. Always analyze your query patterns before creating indexes.',
      ar: 'يمكن أن تحسن الفهرسة الصحيحة أداء الاستعلام بما يصل إلى 1000 ضعف. قم دائمًا بتحليل أنماط الاستعلام الخاصة بك قبل إنشاء الفهارس.'
    },
    status: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    title: {
      en: 'React Performance',
      ar: 'أداء React'
    },
    description: {
      en: 'Use React.memo() and useMemo() wisely. Premature optimization is the root of all evil.',
      ar: 'استخدم React.memo() و useMemo() بحكمة. التحسين المبكر هو أصل كل الشرور.'
    },
    status: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  const sideNoteResult = db.sideNote.insertMany(sideNotes);
  print(`✓ Inserted ${sideNoteResult.insertedIds.length} side notes`);
} catch (err) {
  print(`✗ Error inserting side notes: ${err.message}`);
}

// =======================
// 5. CREATE TOOLS
// =======================
print('\n5. Creating Tools...');

const tools = [
  {
    _id: createObjectId(),
    name: 'VS Code',
    description: 'Visual Studio Code is a lightweight but powerful source code editor with excellent TypeScript and debugging support.',
    url: 'https://code.visualstudio.com/',
    category: 'development',
    tags: [tsTagId, jsTagId],
    status: 'published',
    submitterId: testUserId,
    userRatings: {},
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    name: 'MongoDB Compass',
    description: 'MongoDB Compass is the official GUI for MongoDB. It provides a visual way to explore your data, run queries, and optimize performance.',
    url: 'https://www.mongodb.com/products/compass',
    category: 'development',
    tags: [mongoTagId, backendTagId],
    status: 'published',
    submitterId: testUserId,
    userRatings: {},
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    name: 'Postman',
    description: 'Postman is an API platform for building and testing APIs. It simplifies API development and collaboration.',
    url: 'https://www.postman.com/',
    category: 'development',
    tags: [backendTagId],
    status: 'published',
    submitterId: testUserId,
    userRatings: {},
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    name: 'Figma',
    description: 'Figma is a collaborative interface design tool that helps teams create, test, and ship better designs.',
    url: 'https://www.figma.com/',
    category: 'design',
    tags: [frontendTagId],
    status: 'published',
    submitterId: testUserId,
    userRatings: {},
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  const toolResult = db.tool.insertMany(tools);
  print(`✓ Inserted ${toolResult.insertedIds.length} tools`);
} catch (err) {
  print(`✗ Error inserting tools: ${err.message}`);
}

// =======================
// 6. CREATE QUESTIONS
// =======================
print('\n6. Creating Questions...');

const questions = [
  {
    _id: createObjectId(),
    title: {
      en: 'How to use NestJS?',
      ar: 'كيفية استخدام NestJS؟'
    },
    content: {
      en: 'I am new to NestJS and want to learn how to build a REST API. What are the best practices?',
      ar: 'أنا جديد على NestJS وأريد أن أتعلم كيفية بناء REST API. ما هي أفضل الممارسات؟'
    },
    authorId: testUserId,
    tags: [nestTagId, tsTagId, backendTagId],
    status: 'published',
    visibility: 'public',
    viewCount: 45,
    upvoteCount: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    title: {
      en: 'MongoDB vs PostgreSQL',
      ar: 'MongoDB مقابل PostgreSQL'
    },
    content: {
      en: 'What are the main differences between MongoDB and PostgreSQL? When should I use each one?',
      ar: 'ما هي الاختلافات الرئيسية بين MongoDB و PostgreSQL؟ متى يجب علي استخدام كل واحد؟'
    },
    authorId: testUserId,
    tags: [mongoTagId, backendTagId],
    status: 'published',
    visibility: 'public',
    viewCount: 67,
    upvoteCount: 12,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    _id: createObjectId(),
    title: {
      en: 'React State Management',
      ar: 'إدارة حالة React'
    },
    content: {
      en: 'What is the best way to manage global state in a React application? Should I use Context API, Redux, or Zustand?',
      ar: 'ما هي أفضل طريقة لإدارة الحالة العالمية في تطبيق React؟ هل يجب علي استخدام Context API أو Redux أو Zustand؟'
    },
    authorId: testUserId,
    tags: [reactTagId, jsTagId, frontendTagId],
    status: 'draft',
    visibility: 'public',
    viewCount: 23,
    upvoteCount: 5,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000)
  }
];

try {
  const questionResult = db.question.insertMany(questions);
  print(`✓ Inserted ${questionResult.insertedIds.length} questions`);
} catch (err) {
  print(`✗ Error inserting questions: ${err.message}`);
}

// Save question IDs for relations
const nestQuestionId = questions[0]._id;
const mongoQuestionId = questions[1]._id;
const reactQuestionId = questions[2]._id;

// =======================
// 7. CREATE ANSWERS
// =======================
print('\n7. Creating Answers...');

const answers = [
  {
    _id: createObjectId(),
    content: {
      en: 'Start with the official NestJS documentation. Create a new project using the CLI: `nest new project-name`. Then explore modules, controllers, and services.',
      ar: 'ابدأ بالوثائق الرسمية لـ NestJS. أنشئ مشروعًا جديدًا باستخدام CLI: `nest new project-name`. ثم استكشف الوحدات والتحكم والخدمات.'
    },
    authorId: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    content: {
      en: 'Use DTOs (Data Transfer Objects) for validation, implement proper error handling with filters, and use guards for authentication.',
      ar: 'استخدم DTOs (كائنات نقل البيانات) للتحقق، وقم بتنفيذ معالجة الأخطاء المناسبة باستخدام المرشحات، واستخدم الحراس للمصادقة.'
    },
    authorId: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    content: {
      en: 'MongoDB is great for flexible schemas and horizontal scaling. PostgreSQL is better for complex queries and data integrity. Choose based on your use case.',
      ar: 'MongoDB رائع للمخططات المرنة والتوسع الأفقي. PostgreSQL أفضل للاستعلامات المعقدة وسلامة البيانات. اختر بناءً على حالة الاستخدام الخاصة بك.'
    },
    authorId: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    content: {
      en: 'For simple apps, Context API is sufficient. For complex state management, use Redux Toolkit or Zustand. Zustand is lighter and easier to use.',
      ar: 'للتطبيقات البسيطة، Context API كافية. لإدارة الحالة المعقدة، استخدم Redux Toolkit أو Zustand. Zustand أخف وأسهل في الاستخدام.'
    },
    authorId: testUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  const answerResult = db.answer.insertMany(answers);
  print(`✓ Inserted ${answerResult.insertedIds.length} answers`);
} catch (err) {
  print(`✗ Error inserting answers: ${err.message}`);
}

// Save answer IDs for relations
const answer1Id = answers[0]._id;
const answer2Id = answers[1]._id;
const answer3Id = answers[2]._id;
const answer4Id = answers[3]._id;

// =======================
// 8. CREATE QUESTION-ANSWER RELATIONS
// =======================
print('\n8. Creating Question-Answer Relations...');

const relations = [
  {
    _id: createObjectId(),
    questionId: nestQuestionId,
    answerId: answer1Id,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    questionId: nestQuestionId,
    answerId: answer2Id,
    position: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    questionId: mongoQuestionId,
    answerId: answer3Id,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: createObjectId(),
    questionId: reactQuestionId,
    answerId: answer4Id,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  const relationResult = db['question-answer-relation'].insertMany(relations);
  print(`✓ Inserted ${relationResult.insertedIds.length} question-answer relations`);
} catch (err) {
  print(`✗ Error inserting relations: ${err.message}`);
}

// =======================
// SUMMARY
// =======================
print('\n========================================');
print('SEED COMPLETED SUCCESSFULLY!');
print('========================================');
print(`Tags: ${tags.length}`);
print(`Articles: ${articles.length}`);
print(`Quotes: ${quotes.length}`);
print(`Side Notes: ${sideNotes.length}`);
print(`Tools: ${tools.length}`);
print(`Questions: ${questions.length}`);
print(`Answers: ${answers.length}`);
print(`Relations: ${relations.length}`);
print('========================================\n');

// Print some sample IDs for reference
print('Sample IDs for testing:');
print(`- Tag ID (NestJS): ${nestTagId}`);
print(`- Article ID (NestJS): ${articles[0]._id}`);
print(`- Question ID (NestJS): ${nestQuestionId}`);
print(`- Tool ID (VS Code): ${tools[0]._id}`);
print('\n');
