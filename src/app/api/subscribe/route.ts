// src/app/api/subscribe/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

// Initialize Resend
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}


// Function to create the subscriptions table if it doesn't exist
async function ensureTablesExist(): Promise<boolean> {
  try {
    // Use raw SQL to check if table exists and create it if it doesn't
    const { error } = await supabase.rpc('create_subscriptions_if_not_exists');

    if (error) {
      console.error('Error creating tables:', error);
      // Try a simpler approach - just check if attempting to use the table generates an error
      const { error: testError } = await supabase
        .from('subscriptions')
        .select('count(*)')
        .limit(1);

      if (testError && testError.message.includes('does not exist')) {
        return false;
      }

      // If we don't get a "table doesn't exist" error, assume the table exists
      return !testError;
    }

    return true;
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email, campus } = await request.json();

    // Validate inputs
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address'
        },
        { status: 400 }
      );
    }

    if (!campus) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campus selection is required'
        },
        { status: 400 }
      );
    }

    // Check if subscriptions table exists
    const tablesExist = await ensureTablesExist();

    if (!tablesExist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription system is not properly set up. Please contact the administrator.'
        },
        { status: 500 }
      );
    }

    // Check if email already exists for this campus
    try {
      const { data: existingSubscription, error: queryError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', email)
        .eq('campus', campus);

      if (queryError) {
        console.error('Error checking subscription:', queryError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to check subscription status'
          },
          { status: 500 }
        );
      }

      // If already subscribed, return success but indicate it was existing
      if (existingSubscription && existingSubscription.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'You are already subscribed to notifications for this campus',
          alreadySubscribed: true
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Continue anyway, as the insert might still work
    }

    // Add subscription to the database
    try {
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert([
          {
            email,
            campus,
            created_at: new Date().toISOString(),
            active: true
          }
        ]);

      if (insertError) {
        console.error('Error inserting subscription:', insertError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to save subscription'
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error inserting subscription:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save subscription'
        },
        { status: 500 }
      );
    }

    // Send confirmation email if Resend is configured
    if (resend) {
      try {
        const campusName = campus === 'all'
          ? 'All RGUKT Campuses'
          : `RGUKT ${campus.charAt(0).toUpperCase() + campus.slice(1)}`;

        await resend.emails.send({
          from: `RGUKT Tenders <${process.env.RESEND_FROM_EMAIL || 'notifications@resend.dev'}>`,
          to: email,
          subject: `Subscription Confirmed - RGUKT Tenders Notifications`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Subscription Confirmed</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                  .content { padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px; }
                  .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
                  .btn { display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Subscription Confirmed</h1>
                  </div>
                  <div class="content">
                    <p>Thank you for subscribing to RGUKT Tenders notifications!</p>
                    <p>You will now receive email notifications whenever new tenders are published for <strong>${campusName}</strong>.</p>
                    <p>These notifications will help you stay updated on the latest tender opportunities without having to manually check the website.</p>
                    <p>If you ever wish to unsubscribe, you can click the unsubscribe link that will be included in all notification emails.</p>
                    <a href="${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-domain.com'}" class="btn">Visit Tenders Portal</a>
                  </div>
                  <div class="footer">
                    <p>This is an automated email from the RGUKT Tenders Portal. Please do not reply to this email.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Continue even if email fails - the subscription was still saved
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to notifications for ${campus === 'all' ? 'all campuses' : campus}`
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

// For unsubscribing - typically via a unique token link in emails
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid unsubscribe token'
        },
        { status: 400 }
      );
    }

    // Check if tables exist
    const tablesExist = await ensureTablesExist();

    if (!tablesExist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription system is not properly set up. Please contact the administrator.'
        },
        { status: 500 }
      );
    }

    // Lookup the token in the database
    try {
      const { data, error } = await supabase
        .from('subscription_tokens')
        .select('subscription_id')
        .eq('token', token)
        .single();

      if (error || !data) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or expired unsubscribe token'
          },
          { status: 400 }
        );
      }

      // Update the subscription to inactive
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ active: false })
        .eq('id', data.subscription_id);

      if (updateError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to unsubscribe'
          },
          { status: 500 }
        );
      }

      // Delete the used token
      await supabase
        .from('subscription_tokens')
        .delete()
        .eq('token', token);

      // Redirect to a success page or return success response
      return NextResponse.redirect(new URL('/unsubscribed', request.url));
    } catch (error) {
      console.error('Error processing unsubscribe:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process your unsubscribe request'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}