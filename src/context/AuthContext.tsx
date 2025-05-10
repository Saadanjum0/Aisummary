import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // Ensure sonner is correctly set up

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;           // True if still determining initial auth state (was initialLoading)
  isAuthenticating: boolean;  // True if a login/signup/reset operation is in progress
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // For initial page load auth check
  const [isAuthenticating, setIsAuthenticating] = useState(false); // For specific auth actions
  const navigate = useNavigate();

  useEffect(() => {
    // setInitialLoading(true) is implicitly done by useState, but good to be clear.

    const { data: { subscription }, error: subscriptionError } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setInitialLoading(false); // Critical: set loading to false AFTER first state is received
      }
    );

    if (subscriptionError) {
      console.error('Error subscribing to auth state changes:', subscriptionError);
      toast.error('Error setting up authentication listener. App may not behave correctly.');
      setInitialLoading(false); // Stop loading if subscription fails
    } else if (!subscription) {
      // This case should be rare with Supabase but good to handle
      console.warn('Auth state change subscription was not established. This is unexpected.');
      setInitialLoading(false); // Stop loading to prevent app hanging
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  async function signIn(email: string, password: string) {
    setIsAuthenticating(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast.error(error.message || "Failed to sign in.");
        return;
      }
      
      // onAuthStateChange will update user/session.
      // data.session might be null if MFA is enabled or other flows.
      // Rely on onAuthStateChange for consistent state updates.
      toast.success("Successfully signed in!");
      if (data.session) { // If session is immediately available
        navigate('/app', { replace: true });
      } else {
        // For cases like MFA or if session is not immediately in response,
        // onAuthStateChange will eventually update and ProtectedRoute will react.
        // If you expect immediate navigation always, ensure your Supabase flow supports it.
        // This navigation might happen before onAuthStateChange fully processes for the new session.
        navigate('/app', { replace: true }); // Or navigate to an intermediate page if needed
      }
    } catch (error: any) {
      console.error("Critical error during sign in process:", error);
      toast.error(error.message || "Failed to sign in due to an unexpected error.");
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    setIsAuthenticating(true);
    try {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { full_name: fullName },
          // emailRedirectTo: `${window.location.origin}/welcome` // If you have email confirmation redirect
        }
      });
      
      if (error) {
        toast.error(error.message || "Failed to sign up.");
        return;
      }
      
      // Check Supabase project settings: "Require email confirmation?"
      if (data.session) {
        // User is signed up AND logged in (e.g., email confirmation is OFF)
        toast.success("Registration successful and logged in!");
        navigate('/app', { replace: true });
      } else if (data.user) {
        // User is signed up but needs to confirm email (e.g., email confirmation is ON)
        toast.success("Registration successful! Please check your email for verification.");
        navigate('/login', { replace: true }); // Or a page saying "check your email"
      } else {
        // This case implies user might already exist but without an active session (e.g. already verified but not logged in)
        // Or an unexpected response from Supabase.
        toast.info("Registration processed. If you're a new user, check your email. Otherwise, try logging in.");
        navigate('/login', { replace: true });
      }

    } catch (error: any) {
      console.error("Error signing up:", error);
      toast.error(error.message || "Failed to sign up due to an unexpected error.");
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function signOut() {
    setIsAuthenticating(true); // Optional: show loading during sign out
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message || "Failed to sign out.");
      } else {
        // onAuthStateChange will set user/session to null.
        toast.success("You have been signed out.");
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error(error.message || "Failed to sign out due to an unexpected error.");
    } finally {
      setIsAuthenticating(false); // Optional
    }
  }

  async function resetPassword(email: string) {
    setIsAuthenticating(true);
    try {
      // Ensure this redirectTo path exists in your app and can handle the password reset flow.
      const redirectTo = `${window.location.origin}/update-password`; 
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) {
        toast.error(error.message || "Failed to send password reset email.");
        return;
      }
      
      toast.success("Password reset instructions have been sent. Please check your email.");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to send password reset instructions due to an unexpected error.");
    } finally {
      setIsAuthenticating(false);
    }
  }
  
  const isAuthenticated = !!user && !!session;

  const value = useMemo(() => ({
    user,
    session,
    loading: initialLoading, // Expose initialLoading as 'loading' for ProtectedRoute
    isAuthenticating,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword
  }), [user, session, initialLoading, isAuthenticating, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}