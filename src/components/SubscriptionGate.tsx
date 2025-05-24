
// src/components/SubscriptionGate.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Zap } from 'lucide-react';

interface SubscriptionGateProps {
  feature: string;
  children: React.ReactNode;
  hasAccess: boolean;
  currentUsage?: number;
  usageLimit?: number;
  onUpgrade?: () => void;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  feature,
  children,
  hasAccess,
  currentUsage,
  usageLimit,
  onUpgrade
}) => {
  if (hasAccess) {
    return <>{children}</>;
  }

  const isUsageLimited = typeof currentUsage === 'number' && typeof usageLimit === 'number';

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          {isUsageLimited ? (
            <Zap className="w-8 h-8 text-amber-600" />
          ) : (
            <Lock className="w-8 h-8 text-amber-600" />
          )}
        </div>
        <CardTitle className="text-xl text-amber-800">
          {isUsageLimited ? 'Usage Limit Reached' : 'Premium Feature'}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {isUsageLimited ? (
          <div className="mb-4">
            <p className="text-amber-700 mb-2">
              You&apos;ve used {currentUsage} out of {usageLimit} free {feature} today.
            </p>
            <p className="text-amber-600 text-sm">
              Upgrade to get unlimited access to this feature.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-amber-700 mb-2">
              This {feature} feature is only available to premium subscribers.
            </p>
            <p className="text-amber-600 text-sm">
              Upgrade your plan to unlock this and many other premium features.
            </p>
          </div>
        )}

        {onUpgrade && (
          <Button onClick={onUpgrade} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Usage example in your Dashboard component:
//
// const Dashboard = () => {
//   const [userEmail] = useState('user@example.com'); // Get from auth
//   const { subscription, hasFeature, checkUsage, trackUsage } = useSubscription(userEmail);
//   const [usage, setUsage] = useState({ allowed: true, currentUsage: 0, limit: 10 });
//
//   useEffect(() => {
//     const checkTenderViewUsage = async () => {
//       const usageData = await checkUsage('tender_views');
//       setUsage(usageData);
//     };
//     checkTenderViewUsage();
//   }, []);
//
//   const handleTenderView = async () => {
//     if (usage.allowed) {
//       await trackUsage('tender_views');
//       // Update usage state
//       const newUsage = await checkUsage('tender_views');
//       setUsage(newUsage);
//     }
//   };
//
//   return (
//     <SubscriptionGate
//       feature="tender viewing"
//       hasAccess={usage.allowed}
//       currentUsage={usage.currentUsage}
//       usageLimit={usage.limit}
//       onUpgrade={() => window.location.href = '/subscription'}
//     >
//       {/* Your tender content here */}
//     </SubscriptionGate>
//   );
// };