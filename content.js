// Content script for AdGuard Pro
(function() {
  'use strict';

  class ContentBlocker {
    constructor() {
      this.isEnabled = true;
      this.blockedElements = new Set();
      this.observer = null;
      this.init();
    }

    async init() {
      // Get current status from background
      const status = await this.sendMessage({ action: 'getStatus' });
      this.isEnabled = status.isEnabled;
      
      if (this.isEnabled) {
        this.startBlocking();
      }
      
      // Listen for messages from background
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleBlocking') {
          this.isEnabled = request.enabled;
          if (this.isEnabled) {
            this.startBlocking();
          } else {
            this.stopBlocking();
          }
        }
      });
    }

    startBlocking() {
      // Block existing elements
      this.blockAds();
      
      // Set up mutation observer for dynamically added content
      this.setupMutationObserver();
      
      // Set up scroll and resize handlers for lazy-loaded content
      this.setupEventHandlers();
    }

    stopBlocking() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      // Restore blocked elements
      this.restoreBlockedElements();
    }

    blockAds() {
      // Common ad selectors
      const adSelectors = [
        // Generic ad classes and IDs
        '.ad', '.ads', '.advertisement', '.advert', '.ad-banner', '.ad-container',
        '#ad', '#ads', '#advertisement', '#advert', '#ad-banner', '#ad-container',
        
        // Google AdSense
        '.adsbygoogle', 'ins[class*="adsbygoogle"]',
        
        // Common ad networks
        '.google-ad', '.doubleclick-ad', '.amazon-ad', '.facebook-ad',
        
        // Social media ads
        '[data-ad]', '[data-ads]', '[data-advertisement]',
        
        // Video ads
        '.video-ad', '.preroll-ad', '.midroll-ad',
        
        // Popup and overlay ads
        '.popup-ad', '.overlay-ad', '.modal-ad', '.interstitial-ad',
        
        // Sponsored content
        '.sponsored', '.promoted', '[data-sponsored]',
        
        // Affiliate links
        '.affiliate', '.affiliate-link',
        
        // Newsletter popups
        '.newsletter-popup', '.email-signup-popup',
        
        // Cookie notices (optional)
        '.cookie-notice', '.cookie-banner', '.gdpr-notice'
      ];

      // Block elements by selector
      adSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => this.blockElement(element));
        } catch (error) {
          console.error('Error blocking selector:', selector, error);
        }
      });

      // Block elements by text content
      this.blockByTextContent();
      
      // Block elements by URL patterns
      this.blockByUrlPatterns();
    }

    blockByTextContent() {
      const adTexts = [
        'advertisement', 'sponsored', 'promoted', 'ad', 'ads',
        'buy now', 'click here', 'learn more', 'sign up now',
        'limited time', 'special offer', 'discount'
      ];

      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        if (element.children.length === 0) { // Only check leaf elements
          const text = element.textContent.toLowerCase().trim();
          if (adTexts.some(adText => text.includes(adText))) {
            // Check if it's likely an ad (not just containing ad-related text)
            if (this.isLikelyAd(element)) {
              this.blockElement(element);
            }
          }
        }
      });
    }

    blockByUrlPatterns() {
      const adUrlPatterns = [
        /doubleclick\.net/i,
        /googleadservices\.com/i,
        /googlesyndication\.com/i,
        /amazon-adsystem\.com/i,
        /facebook\.com.*ads/i,
        /outbrain\.com/i,
        /taboola\.com/i,
        /adsystem\.com/i,
        /advertising\.com/i,
        /ads\.yahoo\.com/i
      ];

      // Block iframes with ad URLs
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        const src = iframe.src || iframe.getAttribute('data-src') || '';
        if (adUrlPatterns.some(pattern => pattern.test(src))) {
          this.blockElement(iframe);
        }
      });

      // Block images with ad URLs
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (adUrlPatterns.some(pattern => pattern.test(src))) {
          this.blockElement(img);
        }
      });
    }

    isLikelyAd(element) {
      // Check element dimensions
      const rect = element.getBoundingClientRect();
      const commonAdSizes = [
        [300, 250], [728, 90], [160, 600], [320, 50], [468, 60], [336, 280]
      ];
      
      const isCommonAdSize = commonAdSizes.some(([width, height]) => 
        Math.abs(rect.width - width) < 10 && Math.abs(rect.height - height) < 10
      );

      // Check parent element classes
      const parent = element.parentElement;
      const parentClasses = parent ? parent.className.toLowerCase() : '';
      const hasAdParent = /ad|advertisement|sponsored|promoted/.test(parentClasses);

      return isCommonAdSize || hasAdParent;
    }

    blockElement(element) {
      if (this.blockedElements.has(element)) return;
      
      // Store original display style
      const originalDisplay = element.style.display;
      element.setAttribute('data-original-display', originalDisplay);
      
      // Hide the element
      element.style.display = 'none !important';
      element.style.visibility = 'hidden !important';
      element.style.opacity = '0 !important';
      element.style.height = '0 !important';
      element.style.width = '0 !important';
      element.style.margin = '0 !important';
      element.style.padding = '0 !important';
      
      // Mark as blocked
      element.setAttribute('data-adguard-blocked', 'true');
      this.blockedElements.add(element);
      
      // Notify background script
      this.sendMessage({ action: 'elementBlocked' });

      // Show LeBron James GIF overlay
      this.showLebronBlockGif();
    }

    restoreBlockedElements() {
      this.blockedElements.forEach(element => {
        const originalDisplay = element.getAttribute('data-original-display') || '';
        element.style.display = originalDisplay;
        element.style.visibility = '';
        element.style.opacity = '';
        element.style.height = '';
        element.style.width = '';
        element.style.margin = '';
        element.style.padding = '';
        element.removeAttribute('data-adguard-blocked');
        element.removeAttribute('data-original-display');
      });
      
      this.blockedElements.clear();
    }

    setupMutationObserver() {
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.checkAndBlockElement(node);
              }
            });
          }
        });
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    setupEventHandlers() {
      // Handle lazy-loaded content
      const checkForNewAds = () => {
        if (this.isEnabled) {
          this.blockAds();
        }
      };

      window.addEventListener('scroll', this.throttle(checkForNewAds, 1000));
      window.addEventListener('resize', this.throttle(checkForNewAds, 1000));
    }

    checkAndBlockElement(element) {
      // Check if element matches ad selectors
      const adSelectors = [
        '.ad', '.ads', '.advertisement', '.advert', '.ad-banner',
        '.adsbygoogle', '.google-ad', '.doubleclick-ad',
        '.sponsored', '.promoted', '[data-ad]'
      ];

      adSelectors.forEach(selector => {
        if (element.matches && element.matches(selector)) {
          this.blockElement(element);
        }
        
        // Check children too
        const children = element.querySelectorAll(selector);
        children.forEach(child => this.blockElement(child));
      });
    }

    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }

    sendMessage(message) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          resolve(response || {});
        });
      });
    }

    // Show LeBron James GIF overlay when an ad is blocked
    showLebronBlockGif() {
      let overlay = document.getElementById('lebron-block-gif-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lebron-block-gif-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '20px';
        overlay.style.bottom = '';
        overlay.style.right = '20px';
        overlay.style.zIndex = '999999';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 0.3s';
        overlay.style.opacity = '0';
        overlay.innerHTML = `<img src="${chrome.runtime.getURL('blocked-by-james.gif')}" style="width:480px; height:auto; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.3);" />`;
        document.body.appendChild(overlay);
      }
      // Show the overlay
      overlay.style.opacity = '1';
      // Hide after 5 seconds
      clearTimeout(overlay._hideTimeout);
      overlay._hideTimeout = setTimeout(() => {
        overlay.style.opacity = '0';
      }, 5000);
    }
  }

  // Initialize content blocker when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new ContentBlocker();
    });
  } else {
    new ContentBlocker();
  }
})();