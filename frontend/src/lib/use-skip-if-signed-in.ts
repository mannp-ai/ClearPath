import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCurrentUser } from './api';

// Sends someone who already has a session past the sign-in and sign-up forms. Asks the server, not just
// for a cookie: redirecting on a stale cookie would loop between here and the protected page.
export function useSkipIfSignedIn(destination: string) {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then(() => {
        if (active) router.replace(destination);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router, destination]);
}
