import { useEffect, useRef } from 'react';
import { loadGoogleScript } from '../../utils/googleAuth';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { useToast } from '../ui/Toast';

export default function GoogleSignInButton({ onSuccess }) {
     const buttonRef = useRef(null);
     const setUser = useAuthStore((s) => s.setUser);
     const showToast = useToast();

     useEffect(() => {
          let cancelled = false;

          loadGoogleScript().then(() => {
               if (cancelled || !window.google?.accounts?.id) return;

               if (!window.google_gsi_initialized) {
                    window.google.accounts.id.initialize({
                         client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                         callback: async (response) => {
                              try {
                                   const res = await authApi.googleAuth(response.credential);
                                   const user = res.loggedInUser || res.data?.user || res.data;
                                   setUser(user);
                                   showToast('Signed in with Google!', 'success');
                                   onSuccess?.();
                              } catch (err) {
                                   showToast(err.message || 'Google sign-in failed', 'error');
                              }
                         },
                    });
                    window.google_gsi_initialized = true;
               }

               if (buttonRef.current) {
                    window.google.accounts.id.renderButton(buttonRef.current, {
                         theme: 'outline',
                         size: 'large',
                         width: 320,
                         text: 'continue_with',
                    });
               }
          }).catch(() => {
               showToast('Could not load Google Sign-In', 'error');
          });

          return () => { cancelled = true; };
     }, []);

     return <div ref={buttonRef} className="flex justify-center" />;
}