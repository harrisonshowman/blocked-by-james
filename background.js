// Background script for AdGuard Pro
class AdBlocker {
  constructor() {
    this.isEnabled = true;
    this.whitelistedDomains = new Set();
    this.blockedCount = 0;
    this.init();
  }

  async init() {
    // Load settings from storage
    await this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update badge
    this.updateBadge();
    
    // Load default filter rules
    await this.loadFilterRules();
  }

  setupEventListeners() {
    // Handle extension icon clicks
    chrome.action.onClicked.addListener(() => {
      this.toggleBlocking();
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.processTab(tab);
      }
    });

    // Handle messages from content script and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });

    // Handle web request blocking
    chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
      this.blockedCount++;
      this.updateBadge();
    });
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get({
      isEnabled: true,
      whitelistedDomains: [],
      blockedCount: 0,
      customRules: []
    });
    
    this.isEnabled = result.isEnabled;
    this.whitelistedDomains = new Set(result.whitelistedDomains);
    this.blockedCount = result.blockedCount;
  }

  async saveSettings() {
    await chrome.storage.sync.set({
      isEnabled: this.isEnabled,
      whitelistedDomains: Array.from(this.whitelistedDomains),
      blockedCount: this.blockedCount
    });
  }

  async loadFilterRules() {
    try {
      // Enable or disable rules based on settings
      const rulesetIds = ['default_rules', 'custom_rules'];
      
      if (this.isEnabled) {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
          enableRulesetIds: rulesetIds
        });
      } else {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
          disableRulesetIds: rulesetIds
        });
      }
    } catch (error) {
      console.error('Failed to load filter rules:', error);
    }
  }

  async toggleBlocking() {
    this.isEnabled = !this.isEnabled;
    await this.saveSettings();
    await this.loadFilterRules();
    this.updateBadge();
    
    // Notify all tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleBlocking',
        enabled: this.isEnabled
      }).catch(() => {}); // Ignore errors for tabs that can't receive messages
    });
  }

  async processTab(tab) {
    if (!tab.url) return;
    
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      // Check if domain is whitelisted
      if (this.whitelistedDomains.has(domain)) {
        // Disable blocking for this tab
        await chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: [1000 + tab.id], // Dynamic rule ID
          addRules: []
        });
      }
    } catch (error) {
      console.error('Error processing tab:', error);
    }
  }

  updateBadge() {
    const badgeText = this.isEnabled ? this.blockedCount.toString() : 'OFF';
    const badgeColor = this.isEnabled ? '#4CAF50' : '#F44336';
    
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getStatus':
        sendResponse({
          isEnabled: this.isEnabled,
          blockedCount: this.blockedCount,
          whitelistedDomains: Array.from(this.whitelistedDomains)
        });
        break;
        
      case 'toggleBlocking':
        await this.toggleBlocking();
        sendResponse({ success: true });
        break;
        
      case 'whitelistDomain':
        await this.whitelistDomain(request.domain);
        sendResponse({ success: true });
        break;
        
      case 'removeWhitelist':
        await this.removeWhitelist(request.domain);
        sendResponse({ success: true });
        break;
        
      case 'resetStats':
        this.blockedCount = 0;
        await this.saveSettings();
        this.updateBadge();
        sendResponse({ success: true });
        break;
        
      case 'elementBlocked':
        this.blockedCount++;
        this.updateBadge();
        await this.saveSettings();
        break;
    }
  }

  async whitelistDomain(domain) {
    this.whitelistedDomains.add(domain);
    await this.saveSettings();
    
    // Find tabs with this domain and refresh them
    const tabs = await chrome.tabs.query({ url: `*://${domain}/*` });
    tabs.forEach(tab => {
      chrome.tabs.reload(tab.id);
    });
  }

  async removeWhitelist(domain) {
    this.whitelistedDomains.delete(domain);
    await this.saveSettings();
    
    // Find tabs with this domain and refresh them
    const tabs = await chrome.tabs.query({ url: `*://${domain}/*` });
    tabs.forEach(tab => {
      chrome.tabs.reload(tab.id);
    });
  }
}

// Initialize the ad blocker
const adBlocker = new AdBlocker();