import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SantriNilaiPage from './pages/SantriNilaiPage';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentVerifyPage from './pages/PaymentVerifyPage';
import { supabase } from './lib/supabase';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
    Memuat...
  </div>
);

const ProtectedRoute = ({ session, children }) => {
  if (session === undefined) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" replace />;
  return children;
};

const SubscribedRoute = ({ session, subscription, children }) => {
  if (session === undefined || subscription === undefined) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" replace />;
  if (!subscription) return <Navigate to="/subscribe" replace />;
  return children;
};

const GuestOnlyRoute = ({ session, children }) => {
  if (session === undefined) return <LoadingScreen />;
  return children;
};

function App() {
  const [session, setSession] = useState(undefined);
  const [subscription, setSubscription] = useState(undefined);

  // Fetch subscription status
  const checkSubscription = async (userId) => {
    if (!userId) {
      setSubscription(null);
      return;
    }

    // Set to undefined while loading to keep showing LoadingScreen
    setSubscription(undefined);

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking subscription:', error);
      setSubscription(null);
      return;
    }

    setSubscription(data && data.length > 0 ? data[0] : null);
  };

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        checkSubscription(data.session?.user?.id);
      }
    });

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      checkSubscription(newSession?.user?.id);
    });

    return () => {
      isMounted = false;
      authSub.unsubscribe();
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/auth"
        element={
          <GuestOnlyRoute session={session}>
            <AuthPage />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/subscribe"
        element={
          <ProtectedRoute session={session}>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <SubscribedRoute session={session} subscription={subscription}>
            <DashboardPage />
          </SubscribedRoute>
        }
      />
      <Route
        path="/dashboard/santri/:santriId/nilai"
        element={
          <SubscribedRoute session={session} subscription={subscription}>
            <SantriNilaiPage />
          </SubscribedRoute>
        }
      />
      <Route
        path="/payment/verify"
        element={
          <ProtectedRoute session={session}>
            <PaymentVerifyPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
