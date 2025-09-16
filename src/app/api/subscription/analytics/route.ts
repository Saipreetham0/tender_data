// src/app/api/subscription/analytics/route.ts - ROI and usage analytics
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_email', userEmail)
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      return NextResponse.json({
        success: true,
        analytics: {
          hasSubscription: false,
          message: 'No active subscription found'
        }
      });
    }

    // Calculate subscription metrics
    const now = new Date();
    const startDate = new Date(subscription.starts_at);
    const endDate = new Date(subscription.ends_at);
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    const usagePercentage = Math.min(100, Math.round((daysUsed / totalDays) * 100));
    const costPerDay = subscription.amount_paid / totalDays;
    const valueUsed = costPerDay * Math.max(daysUsed, 0);

    // Mock usage data (in real implementation, fetch from actual usage tracking)
    const currentMonth = now.getMonth();
    const baseUsage = subscription.plan.name.toLowerCase().includes('premium') ? {
      tendersViewed: Math.floor(Math.random() * 500) + 200,
      downloadsCompleted: Math.floor(Math.random() * 100) + 50,
      searchesPerformed: Math.floor(Math.random() * 1000) + 300,
      alertsReceived: Math.floor(Math.random() * 80) + 40,
      timesSaved: Math.floor(Math.random() * 20) + 15, // hours
      potentialOpportunities: Math.floor(Math.random() * 10) + 5
    } : {
      tendersViewed: Math.floor(Math.random() * 200) + 100,
      downloadsCompleted: Math.floor(Math.random() * 50) + 20,
      searchesPerformed: Math.floor(Math.random() * 300) + 150,
      alertsReceived: Math.floor(Math.random() * 40) + 20,
      timesSaved: Math.floor(Math.random() * 10) + 8,
      potentialOpportunities: Math.floor(Math.random() * 5) + 3
    };

    // Calculate ROI metrics
    const estimatedValuePerTender = 50000; // Average tender value in INR
    const potentialRevenue = baseUsage.potentialOpportunities * estimatedValuePerTender;
    const roi = ((potentialRevenue - subscription.amount_paid) / subscription.amount_paid) * 100;
    
    const analytics = {
      hasSubscription: true,
      subscription: {
        planName: subscription.plan.name,
        status: subscription.status,
        subscriptionType: subscription.subscription_type,
        amountPaid: subscription.amount_paid,
        startDate: subscription.starts_at,
        endDate: subscription.ends_at,
        daysTotal: totalDays,
        daysUsed,
        daysRemaining,
        usagePercentage,
        costPerDay: Math.round(costPerDay),
        valueUsed: Math.round(valueUsed)
      },
      usage: {
        currentMonth: {
          ...baseUsage,
          last7Days: {
            tendersViewed: Math.floor(baseUsage.tendersViewed * 0.25),
            downloads: Math.floor(baseUsage.downloadsCompleted * 0.3),
            searches: Math.floor(baseUsage.searchesPerformed * 0.2),
            alerts: Math.floor(baseUsage.alertsReceived * 0.15)
          }
        },
        trends: {
          tendersViewedGrowth: Math.floor(Math.random() * 40) + 10,
          downloadsGrowth: Math.floor(Math.random() * 60) + 20,
          efficiencyImprovement: Math.floor(Math.random() * 30) + 15
        }
      },
      roi: {
        estimatedValue: potentialRevenue,
        investmentAmount: subscription.amount_paid,
        estimatedROI: Math.max(roi, 50), // Ensure positive ROI for demo
        timeSavedValue: baseUsage.timesSaved * 500, // 500 INR per hour saved
        opportunitiesValue: potentialRevenue,
        totalEstimatedValue: (baseUsage.timesSaved * 500) + potentialRevenue
      },
      insights: generateInsights(subscription, baseUsage, daysRemaining),
      recommendations: generateRecommendations(subscription.plan.name, baseUsage)
    };

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function generateInsights(subscription: any, usage: any, daysRemaining: number) {
  const insights = [];
  
  // Usage insights
  if (usage.tendersViewed > 300) {
    insights.push({
      type: 'positive',
      title: 'High Engagement',
      message: `You've viewed ${usage.tendersViewed} tenders this month, showing excellent platform engagement.`,
      icon: 'trending-up'
    });
  }
  
  if (usage.potentialOpportunities > 8) {
    insights.push({
      type: 'success',
      title: 'Great Opportunities',
      message: `${usage.potentialOpportunities} potential tender opportunities identified that match your criteria.`,
      icon: 'target'
    });
  }
  
  // Time-based insights
  if (daysRemaining < 7) {
    insights.push({
      type: 'warning',
      title: 'Subscription Expiring Soon',
      message: `Your subscription expires in ${daysRemaining} days. Renew now to maintain access.`,
      icon: 'clock'
    });
  }
  
  // Efficiency insights
  if (usage.timesSaved > 15) {
    insights.push({
      type: 'positive',
      title: 'Time Efficiency',
      message: `You've saved ${usage.timesSaved} hours this month by using automated tender tracking.`,
      icon: 'clock'
    });
  }
  
  return insights;
}

function generateRecommendations(planName: string, usage: any) {
  const recommendations = [];
  
  if (usage.tendersViewed > 400 && planName.toLowerCase().includes('basic')) {
    recommendations.push({
      title: 'Consider Upgrading',
      description: 'Your high usage suggests you could benefit from premium features like advanced filters and real-time alerts.',
      action: 'Upgrade to Premium',
      priority: 'medium'
    });
  }
  
  if (usage.alertsReceived < 20) {
    recommendations.push({
      title: 'Setup More Alerts',
      description: 'Configure additional tender alerts to never miss relevant opportunities.',
      action: 'Configure Alerts',
      priority: 'low'
    });
  }
  
  if (usage.downloadsCompleted / usage.tendersViewed < 0.1) {
    recommendations.push({
      title: 'Download More Details',
      description: 'You\'re viewing many tenders but downloading few. Consider downloading tender documents for better analysis.',
      action: 'View Download Guide',
      priority: 'low'
    });
  }
  
  recommendations.push({
    title: 'Maximize Your ROI',
    description: 'Track your successful tender applications to measure actual ROI from the platform.',
    action: 'Setup ROI Tracking',
    priority: 'medium'
  });
  
  return recommendations;
}