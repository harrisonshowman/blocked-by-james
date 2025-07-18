// Popup script for AdGuard Pro
class PopupManager {
  constructor() {
    this.currentTab = null;
    this.currentDomain = null;
    this.isEnabled = true;
    this.isWhitelisted = false;
    this.init();
  }

  async init() {
    // Get current tab
    await this.getCurrentTab();
    
    // Load status and update UI
    await this.loadStatus();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update UI
    this.updateUI();
  }

  async getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];
    
    if (this.currentTab && this.currentTab.url) {
      try {
        const url = new URL(this.currentTab.url);
        this.currentDomain = url.hostname;
      } catch (error) {
        console.error('Error parsing URL:', error);
      }
    }
  }

  async loadStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
      this.isEnabled = response.isEnabled;
      this.isWhitelisted = response.whitelistedDomains.includes(this.currentDomain);
      
      // Update stats
      document.getElementById('blockedCount').textContent = response.blockedCount || 0;
      document.getElementById('whitelistedCount').textContent = response.whitelistedDomains.length || 0;
      
    } catch (error) {
      console.error('Error loading status:', error);
    }
  }

  setupEventListeners() {
    // Toggle button
    document.getElementById('toggleButton').addEventListener('click', () => {
      this.toggleBlocking();
    });

    // Whitelist button
    document.getElementById('whitelistButton').addEventListener('click', () => {
      this.toggleWhitelist();
    });

    // Refresh button
    document.getElementById('refreshButton').addEventListener('click', () => {
      this.refreshCurrentTab();
    });

    // Reset stats button
    document.getElementById('resetStatsButton').addEventListener('click', () => {
      this.resetStats();
    });

    // Options button
    document.getElementById('optionsButton').addEventListener('click', () => {
      this.openOptions();
    });

    // Quick filter checkboxes
    document.getElementById('blockPopups').addEventListener('change', (e) => {
      this.saveQuickFilter('blockPopups', e.target.checked);
    });

    document.getElementById('blockSocial').addEventListener('change', (e) => {
      this.saveQuickFilter('blockSocial', e.target.checked);
    });

    document.getElementById('blockTracking').addEventListener('change', (e) => {
      this.saveQuickFilter('blockTracking', e.target.checked);
    });

    document.getElementById('blockCookies').addEventListener('change', (e) => {
      this.saveQuickFilter('blockCookies', e.target.checked);
    });

    // Footer links
    document.getElementById('reportBug').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/adguard-pro/issues' });
    });

    document.getElementById('donate').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://paypal.me/adguardpro' });
    });
  }

  async toggleBlocking() {
    try {
      await chrome.runtime.sendMessage({ action: 'toggleBlocking' });
      this.isEnabled = !this.isEnabled;
      this.updateUI();
    } catch (error) {
      console.error('Error toggling blocking:', error);
    }
  }

  async toggleWhitelist() {
    if (!this.currentDomain) return;

    try {
      if (this.isWhitelisted) {
        await chrome.runtime.sendMessage({ 
          action: 'removeWhitelist', 
          domain: this.currentDomain 
        });
      } else {
        await chrome.runtime.sendMessage({ 
          action: 'whitelistDomain', 
          domain: this.currentDomain 
        });
      }
      
      this.isWhitelisted = !this.isWhitelisted;
      this.updateUI();
      
      // Update whitelist count
      setTimeout(() => this.loadStatus(), 100);
      
    } catch (error) {
      console.error('Error toggling whitelist:', error);
    }
  }

  refreshCurrentTab() {
    if (this.currentTab) {
      chrome.tabs.reload(this.currentTab.id);
      window.close();
    }
  }

  async resetStats() {
    try {
      await chrome.runtime.sendMessage({ action: 'resetStats' });
      document.getElementById('blockedCount').textContent = '0';
      
      // Show confirmation
      const button = document.getElementById('resetStatsButton');
      const originalText = button.innerHTML;
      button.innerHTML = '<span>✓</span>Reset';
      button.style.background = '#4caf50';
      button.style.color = 'white';
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
        button.style.color = '';
      }, 1500);
      
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  }

  openOptions() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  async saveQuickFilter(filterName, enabled) {
    try {
      const filters = await chrome.storage.sync.get('quickFilters') || {};
      filters.quickFilters = filters.quickFilters || {};
      filters.quickFilters[filterName] = enabled;
      await chrome.storage.sync.set(filters);
    } catch (error) {
      console.error('Error saving quick filter:', error);
    }
  }

  async loadQuickFilters() {
    try {
      const result = await chrome.storage.sync.get('quickFilters');
      const filters = result.quickFilters || {};
      
      // Set checkbox states
      document.getElementById('blockPopups').checked = filters.blockPopups !== false;
      document.getElementById('blockSocial').checked = filters.blockSocial !== false;
      document.getElementById('blockTracking').checked = filters.blockTracking !== false;
      document.getElementById('blockCookies').checked = filters.blockCookies === true;
      
    } catch (error) {
      console.error('Error loading quick filters:', error);
    }
  }

  updateUI() {
    // Update toggle button
    const toggleButton = document.getElementById('toggleButton');
    toggleButton.classList.toggle('active', this.isEnabled);
    
    // Update container disabled state
    const container = document.querySelector('.container');
    container.classList.toggle('disabled', !this.isEnabled);
    
    // Update site info
    if (this.currentDomain) {
      document.getElementById('siteName').textContent = this.currentDomain;
      
      const statusElement = document.getElementById('siteStatus');
      if (this.isWhitelisted) {
        statusElement.textContent = 'Whitelisted';
        statusElement.className = 'site-status whitelisted';
      } else if (this.isEnabled) {
        statusElement.textContent = 'Protected';
        statusElement.className = 'site-status protected';
      } else {
        statusElement.textContent = 'Not Protected';
        statusElement.className = 'site-status';
      }
    } else {
      document.getElementById('siteName').textContent = 'Extension Page';
      document.getElementById('siteStatus').textContent = 'N/A';
    }
    
    // Update whitelist button
    const whitelistButton = document.getElementById('whitelistButton');
    whitelistButton.classList.toggle('active', this.isWhitelisted);
    whitelistButton.title = this.isWhitelisted ? 
      'Remove from whitelist' : 'Add to whitelist';
    
    // Disable whitelist button for extension pages
    if (!this.currentDomain || this.currentDomain.startsWith('chrome-extension://')) {
      whitelistButton.disabled = true;
      whitelistButton.style.opacity = '0.5';
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});