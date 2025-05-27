
// // src/hooks/useSubscriptionGate.ts
// import { useRazorpaySubscription } from './useRazorpaySubscription';
// import { useRouter } from 'next/navigation';

// export function useSubscriptionGate(requiredFeature: string) {
//   const { currentSubscription, canAccess, loading } = useRazorpaySubscription();
//   const router = useRouter();

//   const checkAccess = (): boolean => {
//     if (loading) return false;
//     return canAccess(requiredFeature);
//   };

//   const requireAccess = () => {
//     if (!checkAccess()) {
//       router.push('/subscription?upgrade=true&feature=' + requiredFeature);
//       return false;
//     }
//     return true;
//   };

//   return {
//     hasAccess: checkAccess(),
//     requireAccess,
//     loading,
//     subscription: currentSubscription
//   };
// }