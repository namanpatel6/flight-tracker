"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

interface AuthProviderProps {
  children: ReactNode;
}

function AutoLogoutHandler() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      const handleBeforeUnload = () => {
        // This will run when the browser/tab/window is about to close
        // We're using localStorage to ensure the session is invalidated on next load
        localStorage.setItem('autoLogout', 'true');
      };

      // Only check for auto-logout on initial page load, not component mount
      const checkAutoLogout = async () => {
        const shouldLogout = localStorage.getItem('autoLogout');
        if (shouldLogout === 'true') {
          localStorage.removeItem('autoLogout');
          await signOut({ redirect: false });
          window.location.href = '/auth/signin';
        }
      };
      
      // This flag ensures we only check once per browser session
      const hasChecked = sessionStorage.getItem('hasCheckedAutoLogout');
      if (!hasChecked) {
        checkAutoLogout();
        sessionStorage.setItem('hasCheckedAutoLogout', 'true');
      }

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [session]);

  return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AutoLogoutHandler />
      {children}
    </SessionProvider>
  );
} 