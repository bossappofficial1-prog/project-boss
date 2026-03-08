import React from 'react';

export default function SplashScreen() {
  return (
    <>
      <div
        id="splash-screen"
        suppressHydrationWarning
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--background, #ffffff)',
          transition: 'opacity 0.5s ease-out, visibility 0.5s',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          animation: 'splash-enter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        }}>
          {/* Logo */}
          <img
            id="splash-logo"
            src="/assets/logo/logo-bossapp.svg"
            alt="BOSS"
            width={80}
            height={80}
            style={{
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
            }}
          />

          {/* Progress Bar */}
          <div suppressHydrationWarning style={{
            width: '120px',
            height: '1px',
            backgroundColor: 'var(--border, rgba(0,0,0,0.05))',
            overflow: 'hidden',
            position: 'relative',
            borderRadius: '2px',
          }}>
            <div id="splash-progress" suppressHydrationWarning style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '0%',
              height: '100%',
              backgroundColor: '#eb2525', // Brand color
              transition: 'width 0.3s ease-out',
            }} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
                @keyframes splash-enter {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                
                /* Dark Mode Support */
                @media (prefers-color-scheme: dark) {
                    #splash-screen {
                        background-color: var(--background, #09090b) !important;
                    }
                    #splash-screen > div > div:last-child {
                        background-color: rgba(255,255,255,0.1) !important;
                    }
                }
            `}} />

      <script dangerouslySetInnerHTML={{
        __html: `
                (function() {
                    var bar = document.getElementById('splash-progress');
                    var screen = document.getElementById('splash-screen');
                    var logo = document.getElementById('splash-logo');
                    
                    var progress = 0;

                    // Simulasi loading yang lebih natural dan cepat
                    var interval = setInterval(function() {
                        if (progress < 60) {
                            progress += Math.random() * 10 + 5;
                        } else if (progress < 90) {
                            progress += Math.random() * 5 + 2;
                        }
                        if (bar) bar.style.width = Math.min(progress, 95) + '%';
                    }, 100);

                    function dismiss() {
                        clearInterval(interval);
                        
                        // Isi penuh bar sebelum menghilang
                        if (bar) bar.style.width = '100%';
                        
                        setTimeout(function() {
                            if (logo) {
                                logo.style.transform = 'scale(0.95)';
                                logo.style.opacity = '0';
                            }
                            if (screen) {
                                screen.style.opacity = '0';
                                
                                // Hapus dari DOM setelah fade out
                                setTimeout(function() { 
                                    screen.style.visibility = 'hidden';
                                    screen.style.display = 'none'; 
                                }, 500);
                            }
                        }, 250); // Jeda singkat agar bar 100% terlihat
                    }

                    if (document.readyState === 'complete') {
                        dismiss();
                    } else {
                        window.addEventListener('load', function() {
                            setTimeout(dismiss, 100);
                        });
                    }
                })();
            `}} />
    </>
  );
}