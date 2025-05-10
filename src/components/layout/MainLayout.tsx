import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Tags as TagsIcon, PlusCircle, Settings, FileUp } from 'lucide-react'; // Using FileUp for import via Plus
import { cn } from '@/lib/utils';
import { ReactNode } from "react";
import FloatingNav from "./FloatingNav";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path?: string;
  action?: () => void;
  icon: React.ReactNode;
  label: string;
  isCentral?: boolean;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const currentPathnameBeforePop = location.pathname; // Path React Router thinks we are on
      const newWindowPathname = window.location.pathname;  // Path the browser *actually* navigated to

      console.log("[MainLayout] Popstate Event! Current React Path (before pop):", currentPathnameBeforePop, "New Window Path (after pop):", newWindowPathname);

      // Condition: User is logged in, was on an app page (anything MainLayout renders), 
      // and the browser back action has taken them to the landing page ('/').
      if (user && newWindowPathname === '/' && currentPathnameBeforePop !== '/') {
        console.log("[MainLayout] Intercepting back navigation from app (", currentPathnameBeforePop, ") to landing page (", newWindowPathname, "). Showing confirm dialog.");
        
        // Attempt to visually "cancel" the back navigation by pushing the user 
        // back to the page they were on before the popstate event.
        // This makes the dialog appear over the page they were trying to leave.
        navigate(currentPathnameBeforePop, { replace: true });
        
        setShowLogoutConfirm(true);
      } else {
        console.log("[MainLayout] Popstate event did not meet conditions for logout confirm.");
      }
    };

    console.log("[MainLayout] Adding popstate listener. Current path:", location.pathname);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      console.log("[MainLayout] Removing popstate listener. Current path:", location.pathname);
      window.removeEventListener('popstate', handlePopState);
    };
  // IMPORTANT: location.pathname is crucial here. The effect needs to re-run 
  // if the user navigates within the app, so the `currentPathnameBeforePop` in the 
  // closure of `handlePopState` is always up-to-date for the *next* popstate event.
  }, [user, navigate, location.pathname]); 

  const handleConfirmLogoutOnBack = async () => {
    setShowLogoutConfirm(false);
    console.log("[MainLayout] Confirmed logout on back.");
    await signOut(); // signOut should navigate to '/' with replace: true
  };

  const handleCancelLogoutOnBack = () => {
    setShowLogoutConfirm(false);
    console.log("[MainLayout] Cancelled logout on back.");
    // No navigation needed; the popstate handler already pushed us back to currentPathnameBeforePop
  };

  const navItems: NavItem[] = [
    { path: '/app', icon: <Home className="h-5 w-5" />, label: 'Dashboard' },
    { path: '/tags', icon: <TagsIcon className="h-5 w-5" />, label: 'Tags' },
    {
      action: () => navigate('/import'), 
      icon: <FileUp className="h-5 w-5" />,
      label: 'Import', 
      isCentral: true 
    },
    { path: '/profile', icon: <Settings className="h-5 w-5" />, label: 'Profile' }
  ];

  if (loading && !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading application...</div>;
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        <main className="flex-1 overflow-y-auto pb-20"> {/* padding-bottom for nav bar height */}
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-top z-30">
          {/* Changed max-w-xs sm:max-w-sm to max-w-md for slightly more spread of 4 items */}
          <div className="max-w-md mx-auto h-16 flex items-center justify-around px-1 sm:px-2">
            {navItems.map((item) => { // Removed filter for empty label as the placeholder was removed
              return item.isCentral ? (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-150 ease-in-out active:scale-95 transform -translate-y-3"
                  aria-label={item.label}
                >
                  {item.icon} 
                </button>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.path!}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center text-xs rounded-md transition-colors duration-150 ease-in-out w-16 h-14 group", // Fixed width for items
                      isActive 
                        ? 'text-purple-600 dark:text-purple-400 font-medium' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-300'
                    )
                  }
                >
                  <div className={cn("mb-0.5", ({ isActive }: { isActive: boolean }) => isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-300")}>
                      {item.icon}
                  </div>
                  <span className="truncate w-full text-center">{item.label}</span>
                </NavLink>
              )
            })}
        </div>
        </nav>
        {/* FloatingNav was removed in a previous step, ensure it's not needed or re-add if it was specific */}
        {/* <FloatingNav /> */}
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 scale-100 opacity-100" 
               // Using key to re-trigger animation if modal is shown again quickly
               // This part might need framer-motion if you want smooth anims for the modal itself
               key={Date.now()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm Navigation</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to leave the application? This will sign you out.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
              <Button 
                variant="outline"
                onClick={handleCancelLogoutOnBack}
                className="w-full sm:w-auto dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Stay in App
              </Button>
              <Button 
                onClick={handleConfirmLogoutOnBack}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600"
              >
                Leave & Log Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MainLayout;
