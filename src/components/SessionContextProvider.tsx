import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
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
  const [loading, setLoading] = useState(true); // Start as true
  const navigate = useNavigate();
  const location = useLocation();

  // Use a ref to store the latest location.pathname to avoid stale closures
  const locationPathnameRef = useRef(location.pathname);
  useEffect(() => {
    locationPathnameRef.current = location.pathname;
  }, [location.pathname]);

  // Ref to ensure setLoading(false) is called only once after initial session check
  const hasCheckedInitialSession = useRef(false);

  useEffect(() => {
    console.log("SessionContextProvider useEffect running (mount)...");

    const handleAuthStateChange = async (event: string, currentSession: Session | null) => {
      const currentPath = locationPathnameRef.current; // Use the latest path from ref
      console.log(`Auth state change detected: Event=${event}, Session=${currentSession ? 'exists' : 'null'}, Current Location Path=${currentPath}`);
      
      setSession(currentSession);
      setUser(currentSession?.user || null);

      // Only set loading to false once after the initial session check
      if (!hasCheckedInitialSession.current) {
        setLoading(false);
        hasCheckedInitialSession.current = true;
      }

      // Handle redirects based on auth state and current path
      if (currentSession) { // User is authenticated
        if (currentPath === '/login') {
          console.log("SessionContextProvider: Navigating authenticated user from /login to /");
          navigate('/');
        }
      } else { // User is NOT authenticated
        if (currentPath !== '/login') {
          console.log("SessionContextProvider: Navigating unauthenticated user from non-/login to /login");
          navigate('/login');
        }
      }
    };

    // Initial check for session to set loading state correctly on first render
    // This is important because onAuthStateChange might not fire 'INITIAL_SESSION' immediately
    // or consistently across all environments.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!hasCheckedInitialSession.current) {
        setSession(initialSession);
        setUser(initialSession?.user || null);
        setLoading(false);
        hasCheckedInitialSession.current = true;

        // Perform initial redirect check here as well
        const currentPath = locationPathnameRef.current;
        if (initialSession) {
          if (currentPath === '/login') {
            console.log("SessionContextProvider: Initial session check, navigating authenticated user from /login to /");
            navigate('/');
          }
        } else {
          if (currentPath !== '/login') {
            console.log("SessionContextProvider: Initial session check, navigating unauthenticated user from non-/login to /login");
            navigate('/login');
          }
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log("SessionContextProvider useEffect cleanup.");
      authListener.subscription.unsubscribe();
    };
  }, [navigate]); // `location` is not in dependencies, but `locationPathnameRef` is updated by its own effect.

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