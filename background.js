// Listen for YouTube ad and ad server requests
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    chrome.tabs.sendMessage(details.tabId, {action: "showBlockGif"});
    return {cancel: true};
  },
  {
    urls: [
      "*://www.youtube.com/get_video_info*adformat=*",
      "*://www.youtube.com/api/stats/ads*",
      "*://googleads.g.doubleclick.net/*",
      "*://pagead2.googlesyndication.com/*",
      "*://*doubleclick.net/*"
    ],
    types: ["xmlhttprequest", "sub_frame", "script", "image", "media"]
  },
  ["blocking"]
);
