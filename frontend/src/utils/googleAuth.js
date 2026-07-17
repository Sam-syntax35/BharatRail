let scriptLoaded = false;

export function loadGoogleScript() {
  if (scriptLoaded && window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      scriptLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
    document.body.appendChild(script);
  });
}
