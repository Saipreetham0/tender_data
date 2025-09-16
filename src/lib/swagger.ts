// OpenAPI 3.0 specification for admin APIs
export const specs = {
  openapi: '3.0.0',
  info: {
    title: 'RGUKT Tenders SaaS - Admin API Documentation',
    version: '1.0.0',
    description: 'Private API documentation for administrators only. This documentation provides access to all admin endpoints for managing users, payments, analytics, and system health.',
    contact: {
      name: 'API Support',
      email: 'admin@tender-data.com'
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://tender-data.vercel.app/api' 
        : 'http://localhost:3000/api',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      AdminApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-key',
        description: 'Admin API key for authentication'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for user authentication'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'Error message'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-13T10:30:00.000Z'
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-13T10:30:00.000Z'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'uuid-string'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          name: {
            type: 'string',
            example: 'John Doe'
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            example: 'user'
          },
          subscription: {
            type: 'string',
            enum: ['free', 'basic', 'premium'],
            example: 'free'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-13T10:30:00.000Z'
          }
        }
      },
      Payment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'payment-id'
          },
          userId: {
            type: 'string',
            example: 'user-uuid'
          },
          amount: {
            type: 'number',
            example: 999
          },
          currency: {
            type: 'string',
            example: 'INR'
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed', 'refunded'],
            example: 'completed'
          },
          razorpayOrderId: {
            type: 'string',
            example: 'order_abc123'
          },
          razorpayPaymentId: {
            type: 'string',
            example: 'pay_xyz789'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-13T10:30:00.000Z'
          }
        }
      },
      Tender: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Notice inviting quotation for Supply and Delivery of Equipment'
          },
          postedDate: {
            type: 'string',
            example: '12-09-2025'
          },
          closingDate: {
            type: 'string',
            example: '26-09-2025 05:00 PM'
          },
          downloadLinks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  example: 'Document'
                },
                url: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://rguktn.ac.in/tenders/docs/2025/09/NIQ-20250912-03.pdf'
                }
              }
            }
          },
          source: {
            type: 'string',
            example: 'RGUKT Nuzvidu'
          }
        }
      },
      SystemHealth: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'warning', 'critical'],
            example: 'healthy'
          },
          database: {
            type: 'object',
            properties: {
              connected: {
                type: 'boolean',
                example: true
              },
              responseTime: {
                type: 'number',
                example: 45
              }
            }
          },
          services: {
            type: 'object',
            properties: {
              scrapers: {
                type: 'string',
                example: 'operational'
              },
              payments: {
                type: 'string',
                example: 'operational'
              },
              notifications: {
                type: 'string',
                example: 'operational'
              }
            }
          },
          uptime: {
            type: 'number',
            example: 86400
          },
          version: {
            type: 'string',
            example: '1.0.0'
          }
        }
      }
    }
  },
  security: [
    {
      AdminApiKey: []
    }
  ],
  paths: {
    '/api/admin/health': {
      get: {
        tags: ['Admin Health'],
        summary: 'Get comprehensive system health status',
        description: 'Returns detailed system health information including database connectivity, service status, subscription statistics, and performance metrics',
        security: [
          { AdminApiKey: [] },
          { BearerAuth: [] }
        ],
        parameters: [
          {
            in: 'query',
            name: 'key',
            schema: { type: 'string' },
            description: 'Admin API key (alternative to header authentication)'
          }
        ],
        responses: {
          '200': {
            description: 'System health status retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { '$ref': '#/components/schemas/SystemHealth' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin Users'],
        summary: 'Get all users',
        description: 'Retrieve a paginated list of all users in the system with their subscription details and activity status',
        security: [
          { AdminApiKey: [] },
          { BearerAuth: [] }
        ],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number for pagination'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
            description: 'Number of users per page'
          }
        ],
        responses: {
          '200': {
            description: 'Users retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { '$ref': '#/components/schemas/User' }
                    },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};