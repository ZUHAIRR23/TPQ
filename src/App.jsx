import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import SubscriptionPage from './pages/SubscriptionPage';
import DashboardPage from './pages/DashboardPage';
import SantriNilaiPage from './pages/SantriNilaiPage';
import { supabase } from './lib/supabase';
import { hasActiveSubscription } from './lib/subscription';

const ProtectedRoute = ({ session, requiresSubscription = false, hasSubscription = false, children }) => {
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        Memuat...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (requiresSubscription && !hasSubscription) {
    return <Navigate to="/subscription" replace />;
  }

  return children;
};

const GuestOnlyRoute = ({ session, children }) => {
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        Memuat...
      </div>
    );
  }

  return children;
};

function App() {
  const [session, setSession] = useState(undefined);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setHasSubscription(hasActiveSubscription(data.session?.user?.id));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setHasSubscription(hasActiveSubscription(newSession?.user?.id));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
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
        path="/subscription"
        element={
          <SubscriptionPage
            session={session}
            hasSubscription={hasSubscription}
            onSubscriptionChange={setHasSubscription}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session} requiresSubscription hasSubscription={hasSubscription}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/santri/:santriId/nilai"
        element={
          <ProtectedRoute session={session} requiresSubscription hasSubscription={hasSubscription}>
            <SantriNilaiPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
