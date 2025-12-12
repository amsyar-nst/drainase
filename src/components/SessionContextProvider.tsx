import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("SessionContextProvider useEffect running (mount/pathname change)...");

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`Auth state change detected: Event=${event}, Session=${currentSession ? 'exists' : 'null'}, Path=${location.pathname}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        console.log(`User is authenticated. Current path: ${location.pathname}`);
        if (currentSession && location.pathname === '/login') {
          console.log("SessionContextProvider: Navigating authenticated user from /login to /");
          navigate('/'); // Redirect authenticated users from login page to home
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        console.log(`User is signed out. Current path: ${location.pathname}`);
        if (location.pathname !== '/login') {
          console.log("SessionContextProvider: Navigating unauthenticated user from non-/login to /login");
          navigate('/login'); // Redirect unauthenticated users to login page
        }
      }
      setLoading(false);
      console.log(`Loading set to false. Current session: ${currentSession ? 'exists' : 'null'}, User: ${currentSession?.user ? 'exists' : 'null'}`);
    });

    // Initial session check (runs once on mount and when location.pathname changes)
    // This is important for direct access to routes or refresh scenarios
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log(`Initial session check completed. Session=${initialSession ? 'exists' : 'null'}, Path=${location.pathname}`);
      setSession(initialSession);
      setUser(initialSession?.user || null);
      if (!initialSession && location.pathname !== '/login') {
        console.log("SessionContextProvider: Initial check - No session, navigating to /login");
        navigate('/login');
      } else if (initialSession && location.pathname === '/login') {
        console.log("SessionContextProvider: Initial check - Session exists, navigating from /login to /");
        navigate('/');
      }
      setLoading(false);
      console.log(`Initial check loading set to false. Session: ${initialSession ? 'exists' : 'null'}, User: ${initialSession?.user ? 'exists' : 'null'}`);
    });

    return () => {
      console.log("SessionContextProvider useEffect cleanup.");
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]); // Menghapus session dan user dari dependensi

  if (loading) {
    console.log("SessionContextProvider is loading...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-4 text-lg text-muted-foreground">Memuat sesi...</span>
      </div>
    );
  }

  console.log(`SessionContextProvider rendered. Session: ${session ? 'exists' : 'null'}, User: ${user ? 'exists' : 'null'}, Loading: ${loading}`);
  return (
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};