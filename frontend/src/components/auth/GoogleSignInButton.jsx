import { useEffect, useRef } from 'react';
import { loadGoogleScript } from '../../utils/googleAuth';
import { useAuthStore } from '../../stores/auth.store';
import { toast } from '../../stores/toast.store';

export default function GoogleSignInButton({ onSuccess }) {
  const buttonRef = useRef(null);
  const { googleLogin } = useAuthStore();

  useEffect(() => {
    let active = true;

    loadGoogleScript()
      .then(() => {
        if (!active || !window.google?.accounts?.id) return;

        // Initialize Google auth only once
        if (!window.google_gsi_initialized) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: async (response) => {
              try {
                await googleLogin(response.credential);
                toast.success('Signed in successfully with Google!');
                onSuccess?.();
              } catch (err) {
                toast.error(err.message || 'Google authentication failed');
              }
            },
          });
          window.google_gsi_initialized = true;
        }

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_blue',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'circle',
          });
        }
      })
      .catch(() => {
        if (active) {
          toast.error('Unable to initialize Google Sign-in');
        }
      });

    return () => {
      active = false;
    };
  }, [googleLogin, onSuccess]);

  return (
    <div className="flex justify-center w-full min-h-[44px]">
      <div ref={buttonRef} />
    </div>
  );
}
