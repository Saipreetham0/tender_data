// src/app/api/test-tender-notification/route.ts
import { NextResponse } from 'next/server';
import { sendNewTenderNotifications } from '@/lib/email';

export async function GET(request: Request) {
  // Check for API key in query parameters for basic security
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('key');
  const secretKey = process.env.CRON_API_SECRET_KEY;

  if (!apiKey || apiKey !== secretKey) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Create some sample tender data
    const sampleTenders = [
      {
        name: "Test Tender 1 - Supply of Equipment",
        postedDate: new Date().toLocaleDateString(),
        closingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 1 week from now
        downloadLinks: [
          {
            text: "Detailed Notification",
            url: "https://example.com/tender1"
          },
          {
            text: "Technical Specifications",
            url: "https://example.com/tender1/specs"
          }
        ],
        source: "Test Source"
      },
      {
        name: "Test Tender 2 - Construction Project",
        postedDate: new Date().toLocaleDateString(),
        closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 2 weeks from now
        downloadLinks: [
          {
            text: "Detailed Notification",
            url: "https://example.com/tender2"
          }
        ],
        source: "Test Source"
      }
    ];

    // Send the notification
    await sendNewTenderNotifications(sampleTenders, "Test Campus");

    return NextResponse.json({
      success: true,
      message: 'Test tender notification sent successfully',
      sampleData: sampleTenders
    });

  } catch (error) {
    console.error('Error in test notification endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}