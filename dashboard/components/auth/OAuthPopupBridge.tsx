'use client';

import { useEffect } from 'react';

const isOAuthPopupWindow = () => {
  try {
    return window.name === 'google-oauth-login' || sessionStorage.getItem('google-oauth-popup') === '1';
  } catch {
    return window.name === 'google-oauth-login';
  }
};

const notifyParent = (redirect: string) => {
  const message = {
    type: 'google-oauth-callback',
    redirect,
    error: null,
  };

  if (window.opener) {
    window.opener.postMessage(message, window.location.origin);
  }

  try {
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel('google-oauth') : null;
    channel?.postMessage(message);
    channel?.close();
    localStorage.setItem('google-oauth-callback', JSON.stringify(message));
  } catch { }
};

export default function OAuthPopupBridge() {
  useEffect(() => {
    if (!isOAuthPopupWindow()) return;

    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const ignoredPaths = ['/auth/google-popup-start', '/auth/oauth-popup'];
    if (ignoredPaths.includes(window.location.pathname)) return;

    notifyParent(currentPath);

    try {
      sessionStorage.removeItem('google-oauth-popup');
    } catch { }

    window.setTimeout(() => {
      window.close();

      if (!window.closed) {
        window.location.replace(`/auth/oauth-popup?redirect=${encodeURIComponent(currentPath)}`);
      }
    }, 100);
  }, []);

  return null;
}
