import * as dotenv from 'dotenv';
dotenv.config();
import setUpSwagger from './swagger.config';

import * as DEFAULT from './config/default.json';

import * as TEST from './config/test.json';
import * as DEVELOPMENT from './config/development.json';
import * as STAGING from './config/staging.json';
import * as PRODUCTION from './config/production.json';
import { SwaggerModule } from '@nestjs/swagger';

const configObj = {
  test: TEST,
  development: DEVELOPMENT,
  staging: STAGING,
  production: PRODUCTION,
};

export const config = configObj[process.env.NODE_ENV] || DEFAULT;
export const developmentConfig = (app) => {
    // Enable CORS with desired options
  // Enable CORS for all environments
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : null; // Will allow any localhost when null

  app.enableCors({
    origin: (origin, callback) => {
      // If FRONTEND_URL is set, use those specific origins
      if (allowedOrigins && Array.isArray(allowedOrigins)) {
        const allowed = allowedOrigins.includes(origin);
        callback(null, allowed);
      } else {
        // Allow any localhost origin when FRONTEND_URL is not set
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: 'GET,PATCH,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });
  // app.enableCors({
  //   origin: '*',
  //   methods: 'GET, POST, PATCH, PUT, DELETE',
  //   allowedHeaders: 'Content-Type, Authorization'
  // });
  
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'default') {
    return;
  }
  const document = SwaggerModule.createDocument(app, config);

  // Serve raw JSON at /swagger-json
  app.use('/swagger-json', (req, res) => {
    res.json(document);
  });

  setUpSwagger(app);

};