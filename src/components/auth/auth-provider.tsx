"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Handles automatic logout when the browser window/tab is closed
 * and implements improved session tracking
 */
function AutoLogoutHandler() {
  const { data: session } = useSession();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (session) {
      // Function to handle browser/tab closure
      const handleBeforeUnload = () => {
        // Mark session for termination on window close
        localStorage.setItem('autoLogout', 'true');
        localStorage.setItem('logoutTimestamp', Date.now().toString());
      };
      
      // Function to check if we should perform auto-logout
      const checkAutoLogout = async () => {
        const shouldLogout = localStorage.getItem('autoLogout');
        const logoutTimestamp = localStorage.getItem('logoutTimestamp');
        const now = Date.now();
        
        // Only auto-logout if flag is set and within a reasonable time window (within last 24h)
        if (shouldLogout === 'true' && logoutTimestamp) {
          const timestamp = parseInt(logoutTimestamp, 10);
          const timeDiff = now - timestamp;
          const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
          
          if (timeDiff < TWENTY_FOUR_HOURS) {
            // Clean up logout flags
            localStorage.removeItem('autoLogout');
            localStorage.removeItem('logoutTimestamp');
            
            // Perform actual logout
            await signOut({ redirect: false });
            window.location.href = '/auth/signin';
          } else {
            // Clean up expired logout flags
            localStorage.removeItem('autoLogout');
            localStorage.removeItem('logoutTimestamp');
          }
        }
      };
      
      // Only check once per browser session
      const hasChecked = sessionStorage.getItem('hasCheckedAutoLogout');
      if (!hasChecked) {
        checkAutoLogout();
        sessionStorage.setItem('hasCheckedAutoLogout', 'true');
      }
      
      // Set up heartbeat to keep session alive while browser is open
      const FIVE_MINUTES = 5 * 60 * 1000;
      heartbeatRef.current = setInterval(() => {
        // Update last activity timestamp
        localStorage.setItem('lastActivity', Date.now().toString());
      }, FIVE_MINUTES);
      
      // Set up visibility change handler to detect tab switching
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // User returned to the tab - update last activity
          localStorage.setItem('lastActivity', Date.now().toString());
        }
      };
      
      // Add event listeners
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up on unmount
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }
      };
    }
  }, [session]);

  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <AutoLogoutHandler />
      {children}
    </SessionProvider>
  );
} 