// Show the GIF
function showBlockGif() {
  let existing = document.getElementById('blocked-by-james');
  if (existing) existing.remove();

  let img = document.createElement('img');
  img.src = chrome.runtime.getURL('block.gif');
  img.id = 'blocked-by-james';
  img.style = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 120px;
    z-index: 999999;
    pointer-events: none;
    transition: opacity 0.5s;
    opacity: 1;
  `;
  document.body.appendChild(img);

  setTimeout(() => {
    img.style.opacity = 0;
    setTimeout(() => img.remove(), 700);
  }, 1700);
}

// Listen for background.js message
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "showBlockGif") showBlockGif();
});

// Periodically zap common ad elements in DOM
function zapAds() {
  let selectors = [
    '[id^="ad-"]',
    '[class*="ad-"]',
    '[class*="ads"]',
    '[id*="ads"]',
    '.ytp-ad-module',
    '.video-ads',
    'iframe[src*="doubleclick"]',
    'iframe[src*="ads"]'
  ];
  let found = false;
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.remove();
      found = true;
    });
  });
  if (found) showBlockGif();
}
setInterval(zapAds, 2000);
