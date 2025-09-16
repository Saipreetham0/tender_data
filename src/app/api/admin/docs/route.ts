import { NextRequest, NextResponse } from 'next/server';
import { specs } from '@/lib/swagger';
import { verifyAdminAuth } from '@/lib/admin-auth';

/**
 * @swagger
 * /api/admin/docs:
 *   get:
 *     tags:
 *       - Admin Documentation
 *     summary: Get OpenAPI specification
 *     description: Returns the OpenAPI 3.0 specification for admin APIs
 *     security:
 *       - AdminApiKey: []
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Invalid admin credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Return the OpenAPI specification
    return NextResponse.json(specs, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
      },
    });
  } catch (error) {
    console.error('Error serving API documentation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load API documentation',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}