'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  // CRITICAL: Call signInWithRedirect directly. Do NOT use 'await signInWithRedirect(...)'.
  signInWithRedirect(authInstance, provider);
  // The page will be redirected, and the result is handled by the onAuthStateChanged listener or getRedirectResult.
}

/** Environment-aware Google sign-in that works locally, on test domain, and in production */
export async function initiateGoogleSignInWithPopup(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  
  // Detect environment
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost';
  const isCustomDomain = hostname === 'test.colater.com' || hostname.includes('colater.com');
  
  try {
    // Add custom parameters
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(authInstance, provider);
    console.log('Google sign-in successful:', result.user);
    // The onAuthStateChanged listener will handle the rest
  } catch (error: unknown) {
    console.error('Google sign-in error:', error);

    const firebaseError = error as { code?: string };
    // In localhost, if popup fails, try redirect
    // On custom domains and production, always use redirect as it's more reliable
    if (isLocalhost && (firebaseError.code === 'auth/popup-blocked' || firebaseError.code === 'auth/popup-closed-by-user')) {
      console.log('Popup blocked or closed, falling back to redirect...');
      signInWithRedirect(authInstance, provider);
    } else if (!isLocalhost || isCustomDomain) {
      // Use redirect for custom domains and production for better reliability
      console.log('Using redirect authentication for', isCustomDomain ? 'custom domain' : 'production');
      signInWithRedirect(authInstance, provider);
    } else {
      throw error;
    }
  }
}

/** Popup-based Google sign-in - more reliable than redirect */
export function initiateSmartGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  console.log('Using popup authentication');
  
  signInWithPopup(authInstance, provider)
    .then((result) => {
      console.log('Popup sign-in successful:', result.user);
    })
    .catch((error) => {
      console.error('Popup sign-in error:', error);
      
      // If popup fails, fallback to redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        console.log('Popup blocked or closed, falling back to redirect...');
        signInWithRedirect(authInstance, provider);
      } else {
        // Show error to user
        throw error;
      }
    });
}

/**
 * Checks for a redirect result after a user returns to the app.
 * This should be called on the page where the user lands after sign-in.
 */
export async function handleRedirectResult(authInstance: Auth) {
  try {
    // Store debug info about the redirect result processing
    const debugInfo = {
      timestamp: new Date().toISOString(),
      currentUrl: window.location.href,
      urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
      authDomain: authInstance.app.options.authDomain,
      startDebugInfo: sessionStorage.getItem('auth-debug-start')
    };
    
    sessionStorage.setItem('auth-debug-redirect', JSON.stringify(debugInfo));
    console.log('Redirect result debug info:', debugInfo);
    
    // This promise resolves with the user credential on a successful sign-in redirect.
    // It resolves with `null` if the user just visited the page without a redirect.
    const result = await getRedirectResult(authInstance);
    
    if (result) {
      console.log("Redirect result found:", result.user);
      sessionStorage.setItem('auth-debug-success', JSON.stringify({
        timestamp: new Date().toISOString(),
        user: result.user ? { email: result.user.email, uid: result.user.uid } : null
      }));
      // The user was successfully signed in via redirect
      return result;
    } else {
      console.log("No redirect result - user may have visited directly or already signed in");
      sessionStorage.setItem('auth-debug-no-result', JSON.stringify({
        timestamp: new Date().toISOString(),
        reason: 'getRedirectResult returned null'
      }));
      // This is normal - either the user visited the page directly or is already signed in
      return null;
    }
  } catch (error: unknown) {
    // Handle errors here, such as `auth/account-exists-with-different-credential`.
    console.error("Error handling redirect result:", error);
    const firebaseError = error as { code?: string; message?: string; stack?: string };
    sessionStorage.setItem('auth-debug-error', JSON.stringify({
      timestamp: new Date().toISOString(),
      error: {
        code: firebaseError?.code,
        message: firebaseError?.message,
        stack: firebaseError?.stack
      }
    }));
    throw error;
  }
}
