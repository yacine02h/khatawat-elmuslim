document.addEventListener('DOMContentLoaded', () => {
    let deferredPrompt;
    const installBanner = document.getElementById('install-banner');
    const installBtn = document.getElementById('install-btn');
    const closeBannerBtn = document.getElementById('close-banner');

    // Check if the banner was dismissed recently (7 days)
    const isBannerDismissed = () => {
        const dismissedTime = localStorage.getItem('installBannerDismissed');
        if (!dismissedTime) return false;
        
        const now = new Date().getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (now - dismissedTime < sevenDays) {
            return true;
        } else {
            localStorage.removeItem('installBannerDismissed');
            return false;
        }
    };

    // Check if user is on mobile (simple check)
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Capture the install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        
        // Only show if mobile and not dismissed
        if (isMobile() && !isBannerDismissed()) {
            showBanner();
        }
    });

    function showBanner() {
        if (installBanner) {
            installBanner.style.display = 'flex';
            // Add a small delay for animation
            setTimeout(() => {
                installBanner.classList.add('visible');
            }, 100);
        }
    }

    function hideBanner() {
        if (installBanner) {
            installBanner.classList.remove('visible');
            setTimeout(() => {
                installBanner.style.display = 'none';
            }, 300); // Match CSS transition
        }
    }

    // Handle Install Click
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                hideBanner();
            }
        });
    }

    // Handle Close Click
    if (closeBannerBtn) {
        closeBannerBtn.addEventListener('click', () => {
            // Save dismissal time
            localStorage.setItem('installBannerDismissed', new Date().getTime());
            hideBanner();
        });
    }

    // Register Service Worker (Required for PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker Registered'));
    }
});