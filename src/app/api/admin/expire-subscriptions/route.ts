
// // src/app/api/admin/expire-subscriptions/route.ts
// import { NextResponse } from 'next/server';
// import { RazorpayPaymentService } from '@/lib/razorpay-payment';

// export async function POST(request: Request) {
//   try {
//     // Check for API key
//     const { searchParams } = new URL(request.url);
//     const apiKey = searchParams.get('key');
//     const secretKey = process.env.CRON_API_SECRET_KEY;

//     if (!apiKey || apiKey !== secretKey) {
//       return NextResponse.json(
//         { success: false, error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     // Process expired subscriptions
//     await RazorpayPaymentService.processExpiredSubscriptions();

//     return NextResponse.json({
//       success: true,
//       message: 'Expired subscriptions processed successfully',
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('Error processing expired subscriptions:', error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : 'Failed to process expired subscriptions',
//         timestamp: new Date().toISOString()
//       },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/admin/expire-subscriptions/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logCronExecution } from '@/lib/cronLogger';

// Function to process expired subscriptions
async function processExpiredSubscriptions() {
  try {
    const now = new Date().toISOString();

    // Find and update expired subscriptions
    const { data: expiredSubscriptions, error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'expired',
        updated_at: now
      })
      .eq('status', 'active')
      .lt('ends_at', now)
      .select('id, user_email, plan_id');

    if (error) {
      throw new Error(`Failed to process expired subscriptions: ${error.message}`);
    }

    const expiredCount = expiredSubscriptions?.length || 0;

    // Log each expired subscription for audit
    if (expiredSubscriptions && expiredSubscriptions.length > 0) {
      await logCronExecution(
        'expire-subscriptions',
        'success',
        `Expired ${expiredCount} subscriptions`,
        'success',
        { expiredSubscriptions }
      );
    }

    return expiredCount;
  } catch (error) {
    console.error('Error processing expired subscriptions:', error);
    throw error;
  }
}

// Support both GET and POST requests for flexibility
export async function GET(request: Request) {
  return handleExpireSubscriptions(request);
}

export async function POST(request: Request) {
  return handleExpireSubscriptions(request);
}

async function handleExpireSubscriptions(request: Request) {
  const startTime = Date.now();

  try {
    // Check for API key in query parameters
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    const secretKey = process.env.CRON_API_SECRET_KEY;

    if (!apiKey || apiKey !== secretKey) {
      await logCronExecution(
        'expire-subscriptions',
        'failed',
        'Unauthorized access attempt',
        'error',
        {
          providedKey: apiKey ? 'provided' : 'missing',
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }
      );

      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Log start of process
    await logCronExecution(
      'expire-subscriptions',
      'started',
      'Starting subscription expiry process'
    );

    // Process expired subscriptions
    const expiredCount = await processExpiredSubscriptions();

    const duration = Date.now() - startTime;

    // Log completion
    await logCronExecution(
      'expire-subscriptions',
      'completed',
      `Processed ${expiredCount} expired subscriptions in ${duration}ms`,
      'success',
      {
        expiredCount,
        duration,
        timestamp: new Date().toISOString()
      }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${expiredCount} expired subscriptions`,
      expiredCount,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('Error in expire-subscriptions endpoint:', error);

    // Log error
    await logCronExecution(
      'expire-subscriptions',
      'failed',
      `Failed to process expired subscriptions: ${errorMessage}`,
      'error',
      {
        error: errorMessage,
        duration,
        timestamp: new Date().toISOString()
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Alternative direct SQL approach for better performance
export async function handleExpireSubscriptionsSQL() {
  try {
    // Use direct SQL for better performance
    const { data, error } = await supabase.rpc('expire_old_subscriptions');

    if (error) {
      throw new Error(`SQL function error: ${error.message}`);
    }

    return data; // This should return the count of expired subscriptions
  } catch (error) {
    console.error('Error with SQL approach:', error);
    // Fallback to the manual approach
    return await processExpiredSubscriptions();
  }
}