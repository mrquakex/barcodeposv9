import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BarcodePOS Control Plane API',
      version: '1.0.0',
      description: 'Enterprise-level control plane API for BarcodePOS v9',
      contact: {
        name: 'API Support',
        email: 'support@barcodepos.trade',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4001',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
export { swaggerUi };

