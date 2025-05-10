// src/app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Get recipients from environment variable
const notificationRecipients = (process.env.NOTIFICATION_EMAILS || '').split(',').filter(Boolean);

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

  // Check if Resend is configured
  if (!resend) {
    return NextResponse.json(
      { success: false, error: 'Resend API key is not configured' },
      { status: 500 }
    );
  }

  // Check if we have recipients
  if (notificationRecipients.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No notification recipients configured' },
      { status: 500 }
    );
  }

  try {
    // Send a test email
    const { data, error } = await resend.emails.send({
      from: `RGUKT Tenders <${process.env.RESEND_FROM_EMAIL || 'notifications@resend.dev'}>`,
      to: notificationRecipients,
      subject: 'Test Email - RGUKT Tenders Notification System',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Test Email</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px; }
              .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
              .info-item { margin-bottom: 10px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Test Email</h1>
              </div>
              <div class="content">
                <p>This is a test email from the RGUKT Tenders Notification System.</p>
                <p>If you're receiving this email, it means your email delivery system is working correctly!</p>

                <h3>System Information:</h3>
                <div class="info-item">
                  <span class="label">Timestamp:</span> ${new Date().toISOString()}
                </div>
                <div class="info-item">
                  <span class="label">From Email:</span> ${process.env.RESEND_FROM_EMAIL || 'notifications@resend.dev'}
                </div>
                <div class="info-item">
                  <span class="label">Recipients:</span> ${notificationRecipients.join(', ')}
                </div>
                <div class="info-item">
                  <span class="label">Environment:</span> ${process.env.NODE_ENV || 'development'}
                </div>

                <p>This email is part of the RGUKT Tenders system that will notify you when new tenders are published.</p>
              </div>
              <div class="footer">
                <p>This is an automated email from the RGUKT Tenders Portal. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending test email:', error);
      return NextResponse.json(
        { success: false, error: `Failed to send email: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      recipients: notificationRecipients,
      emailId: data?.id,
    });

  } catch (error) {
    console.error('Error in test email endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}