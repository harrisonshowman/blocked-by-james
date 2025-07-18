// Options page script for AdGuard Pro
class OptionsManager {
  constructor() {
    this.settings = {};
    this.whitelistedDomains = [];
    this.init();
  }

  async init() {
    // Load settings from storage
    await this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Populate UI with current settings
    this.populateUI();
    
    // Load statistics
    this.loadStatistics();
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Header actions
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveAllSettings();
    });

    document.getElementById('exportSettings').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('importSettings').addEventListener('click', () => {
      this.importSettings();
    });

    // General settings
    document.getElementById('enableBlocking').addEventListener('change', (e) => {
      this.updateSetting('enableBlocking', e.target.checked);
    });

    document.getElementById('blockPopups').addEventListener('change', (e) => {
      this.updateSetting('blockPopups', e.target.checked);
    });

    document.getElementById('blockSocialWidgets').addEventListener('change', (e) => {
      this.updateSetting('blockSocialWidgets', e.target.checked);
    });

    document.getElementById('blockTracking').addEventListener('change', (e) => {
      this.updateSetting('blockTracking', e.target.checked);
    });

    document.getElementById('blockCookieNotices').addEventListener('change', (e) => {
      this.updateSetting('blockCookieNotices', e.target.checked);
    });

    document.getElementById('enableStealth').addEventListener('change', (e) => {
      this.updateSetting('enableStealth', e.target.checked);
    });

    // Performance settings
    const filteringDelaySlider = document.getElementById('filteringDelay');
    const rangeValue = document.querySelector('.range-value');
    
    filteringDelaySlider.addEventListener('input', (e) => {
      rangeValue.textContent = e.target.value;
      this.updateSetting('filteringDelay', parseInt(e.target.value));
    });

    document.getElementById('enableCache').addEventListener('change', (e) => {
      this.updateSetting('enableCache', e.target.checked);
    });

    // Filter settings
    document.getElementById('easylist').addEventListener('change', (e) => {
      this.updateFilterList('easylist', e.target.checked);
    });

    document.getElementById('easyprivacy').addEventListener('change', (e) => {
      this.updateFilterList('easyprivacy', e.target.checked);
    });

    document.getElementById('fanboy').addEventListener('change', (e) => {
      this.updateFilterList('fanboy', e.target.checked);
    });

    document.getElementById('ublock').addEventListener('change', (e) => {
      this.updateFilterList('ublock', e.target.checked);
    });

    // Custom rules
    document.getElementById('validateRules').addEventListener('click', () => {
      this.validateCustomRules();
    });

    document.getElementById('clearRules').addEventListener('click', () => {
      this.clearCustomRules();
    });

    // Whitelist management
    document.getElementById('addWhitelist').addEventListener('click', () => {
      this.addWhitelistDomain();
    });

    document.getElementById('whitelistDomain').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addWhitelistDomain();
      }
    });

    document.getElementById('exportWhitelist').addEventListener('click', () => {
      this.exportWhitelist();
    });

    document.getElementById('importWhitelist').addEventListener('click', () => {
      this.importWhitelist();
    });

    document.getElementById('clearWhitelist').addEventListener('click', () => {
      this.clearWhitelist();
    });

    // Advanced settings
    document.getElementById('enableLogging').addEventListener('change', (e) => {
      this.updateSetting('enableLogging', e.target.checked);
    });

    document.getElementById('blockWebRTC').addEventListener('change', (e) => {
      this.updateSetting('blockWebRTC', e.target.checked);
    });

    document.getElementById('enableCSPInjection').addEventListener('change', (e) => {
      this.updateSetting('enableCSPInjection', e.target.checked);
    });

    document.getElementById('userAgentOverride').addEventListener('change', (e) => {
      this.updateSetting('userAgentOverride', e.target.value);
    });

    document.getElementById('dnsServers').addEventListener('change', (e) => {
      this.updateSetting('dnsServers', e.target.value);
    });

    // Developer tools
    document.getElementById('clearStorage').addEventListener('click', () => {
      this.clearExtensionData();
    });

    document.getElementById('exportLogs').addEventListener('click', () => {
      this.exportLogs();
    });

    document.getElementById('resetToDefaults').addEventListener('click', () => {
      this.resetToDefaults();
    });

    // File import
    document.getElementById('importFile').addEventListener('change', (e) => {
      this.handleFileImport(e);
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get();
      this.settings = {
        enableBlocking: true,
        blockPopups: true,
        blockSocialWidgets: true,
        blockTracking: true,
        blockCookieNotices: false,
        enableStealth: false,
        filteringDelay: 100,
        enableCache: true,
        filterLists: {
          easylist: true,
          easyprivacy: true,
          fanboy: false,
          ublock: true
        },
        customRules: '',
        enableLogging: false,
        blockWebRTC: false,
        enableCSPInjection: false,
        userAgentOverride: '',
        dnsServers: '1.1.1.1, 8.8.8.8',
        ...result
      };
      
      this.whitelistedDomains = result.whitelistedDomains || [];
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  populateUI() {
    // General settings
    document.getElementById('enableBlocking').checked = this.settings.enableBlocking;
    document.getElementById('blockPopups').checked = this.settings.blockPopups;
    document.getElementById('blockSocialWidgets').checked = this.settings.blockSocialWidgets;
    document.getElementById('blockTracking').checked = this.settings.blockTracking;
    document.getElementById('blockCookieNotices').checked = this.settings.blockCookieNotices;
    document.getElementById('enableStealth').checked = this.settings.enableStealth;

    // Performance settings
    const filteringDelaySlider = document.getElementById('filteringDelay');
    filteringDelaySlider.value = this.settings.filteringDelay;
    document.querySelector('.range-value').textContent = this.settings.filteringDelay;
    document.getElementById('enableCache').checked = this.settings.enableCache;

    // Filter lists
    const filterLists = this.settings.filterLists || {};
    document.getElementById('easylist').checked = filterLists.easylist !== false;
    document.getElementById('easyprivacy').checked = filterLists.easyprivacy !== false;
    document.getElementById('fanboy').checked = filterLists.fanboy === true;
    document.getElementById('ublock').checked = filterLists.ublock !== false;

    // Custom rules
    document.getElementById('customRules').value = this.settings.customRules || '';

    // Whitelist
    this.populateWhitelist();

    // Advanced settings
    document.getElementById('enableLogging').checked = this.settings.enableLogging;
    document.getElementById('blockWebRTC').checked = this.settings.blockWebRTC;
    document.getElementById('enableCSPInjection').checked = this.settings.enableCSPInjection;
    document.getElementById('userAgentOverride').value = this.settings.userAgentOverride || '';
    document.getElementById('dnsServers').value = this.settings.dnsServers || '1.1.1.1, 8.8.8.8';
  }

  populateWhitelist() {
    const whitelistList = document.getElementById('whitelistList');
    whitelistList.innerHTML = '';

    if (this.whitelistedDomains.length === 0) {
      whitelistList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No whitelisted domains</p>';
      return;
    }

    this.whitelistedDomains.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'whitelist-item';
      item.innerHTML = `
        <span class="whitelist-domain">${domain}</span>
        <button class="whitelist-remove" data-domain="${domain}">Remove</button>
      `;
      
      item.querySelector('.whitelist-remove').addEventListener('click', (e) => {
        this.removeWhitelistDomain(e.target.dataset.domain);
      });
      
      whitelistList.appendChild(item);
    });
  }

  switchTab(tabId) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    // Load specific tab data
    if (tabId === 'stats') {
      this.loadStatistics();
    }
  }

  updateSetting(key, value) {
    this.settings[key] = value;
    this.debouncedSave();
  }

  updateFilterList(listId, enabled) {
    if (!this.settings.filterLists) {
      this.settings.filterLists = {};
    }
    this.settings.filterLists[listId] = enabled;
    this.debouncedSave();
  }

  debouncedSave = this.debounce(() => {
    this.saveSettings();
  }, 1000);

  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings);
      this.showMessage('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showMessage('Error saving settings', 'error');
    }
  }

  async saveAllSettings() {
    // Collect all current form values
    this.settings.customRules = document.getElementById('customRules').value;
    this.settings.whitelistedDomains = this.whitelistedDomains;
    
    await this.saveSettings();
    
    // Notify background script of settings change
    chrome.runtime.sendMessage({ action: 'settingsUpdated' });
  }

  validateCustomRules() {
    const rules = document.getElementById('customRules').value;
    const lines = rules.split('\n').filter(line => line.trim());
    
    let validRules = 0;
    let invalidRules = 0;
    const errors = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed === '') {
        return; // Skip comments and empty lines
      }

      // Basic validation for common filter syntax
      if (this.isValidFilterRule(trimmed)) {
        validRules++;
      } else {
        invalidRules++;
        errors.push(`Line ${index + 1}: ${trimmed}`);
      }
    });

    let message = `Validation complete: ${validRules} valid rules`;
    if (invalidRules > 0) {
      message += `, ${invalidRules} invalid rules`;
      if (errors.length > 0) {
        message += '\n\nInvalid rules:\n' + errors.slice(0, 5).join('\n');
        if (errors.length > 5) {
          message += `\n... and ${errors.length - 5} more`;
        }
      }
    }

    this.showMessage(message, invalidRules > 0 ? 'error' : 'success');
  }

  isValidFilterRule(rule) {
    // Basic validation for common filter rule patterns
    const patterns = [
      /^\|\|[a-zA-Z0-9.-]+\^?.*$/, // ||domain.com^
      /^[a-zA-Z0-9.-]+\$.*$/, // domain.com$option
      /^@@.*$/, // @@exception
      /^##.*$/, // ##element-hiding
      /^#@#.*$/, // #@#element-hiding-exception
      /^\/.*\/$/, // /regex/
      /^!.*$/ // !comment
    ];

    return patterns.some(pattern => pattern.test(rule));
  }

  clearCustomRules() {
    if (confirm('Are you sure you want to clear all custom rules?')) {
      document.getElementById('customRules').value = '';
      this.updateSetting('customRules', '');
      this.showMessage('Custom rules cleared', 'success');
    }
  }

  addWhitelistDomain() {
    const input = document.getElementById('whitelistDomain');
    const domain = input.value.trim().toLowerCase();

    if (!domain) {
      this.showMessage('Please enter a domain', 'error');
      return;
    }

    // Basic domain validation
    if (!this.isValidDomain(domain)) {
      this.showMessage('Please enter a valid domain', 'error');
      return;
    }

    if (this.whitelistedDomains.includes(domain)) {
      this.showMessage('Domain already whitelisted', 'error');
      return;
    }

    this.whitelistedDomains.push(domain);
    this.populateWhitelist();
    input.value = '';
    this.updateSetting('whitelistedDomains', this.whitelistedDomains);
    this.showMessage(`${domain} added to whitelist`, 'success');
  }

  removeWhitelistDomain(domain) {
    const index = this.whitelistedDomains.indexOf(domain);
    if (index > -1) {
      this.whitelistedDomains.splice(index, 1);
      this.populateWhitelist();
      this.updateSetting('whitelistedDomains', this.whitelistedDomains);
      this.showMessage(`${domain} removed from whitelist`, 'success');
    }
  }

  isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  }

  exportSettings() {
    const exportData = {
      settings: this.settings,
      whitelistedDomains: this.whitelistedDomains,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    this.downloadJSON(exportData, 'adguard-pro-settings.json');
    this.showMessage('Settings exported successfully', 'success');
  }

  importSettings() {
    document.getElementById('importFile').click();
  }

  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings };
      }

      if (data.whitelistedDomains) {
        this.whitelistedDomains = data.whitelistedDomains;
      }

      this.populateUI();
      await this.saveSettings();
      this.showMessage('Settings imported successfully', 'success');
    } catch (error) {
      console.error('Import error:', error);
      this.showMessage('Error importing settings', 'error');
    }

    // Reset file input
    event.target.value = '';
  }

  exportWhitelist() {
    const exportData = {
      whitelistedDomains: this.whitelistedDomains,
      exportDate: new Date().toISOString()
    };

    this.downloadJSON(exportData, 'adguard-pro-whitelist.json');
  }

  importWhitelist() {
    // Implementation similar to importSettings but for whitelist only
    document.getElementById('importFile').click();
  }

  clearWhitelist() {
    if (confirm('Are you sure you want to clear all whitelisted domains?')) {
      this.whitelistedDomains = [];
      this.populateWhitelist();
      this.updateSetting('whitelistedDomains', this.whitelistedDomains);
      this.showMessage('Whitelist cleared', 'success');
    }
  }

  clearExtensionData() {
    if (confirm('This will clear all extension data including settings, whitelist, and statistics. Are you sure?')) {
      chrome.storage.sync.clear(() => {
        chrome.storage.local.clear(() => {
          this.showMessage('All extension data cleared', 'success');
          setTimeout(() => location.reload(), 1000);
        });
      });
    }
  }

  exportLogs() {
    // Mock implementation - in real extension, this would export actual logs
    const logs = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'Extension started' },
      { timestamp: new Date().toISOString(), level: 'info', message: 'Filter lists loaded' }
    ];

    this.downloadJSON(logs, 'adguard-pro-logs.json');
  }

  resetToDefaults() {
    if (confirm('This will reset all settings to their default values. Are you sure?')) {
      this.settings = {
        enableBlocking: true,
        blockPopups: true,
        blockSocialWidgets: true,
        blockTracking: true,
        blockCookieNotices: false,
        enableStealth: false,
        filteringDelay: 100,
        enableCache: true,
        filterLists: {
          easylist: true,
          easyprivacy: true,
          fanboy: false,
          ublock: true
        },
        customRules: '',
        enableLogging: false,
        blockWebRTC: false,
        enableCSPInjection: false,
        userAgentOverride: '',
        dnsServers: '1.1.1.1, 8.8.8.8'
      };

      this.populateUI();
      this.saveSettings();
      this.showMessage('Settings reset to defaults', 'success');
    }
  }

  async loadStatistics() {
    try {
      const stats = await chrome.storage.local.get(['totalBlocked', 'dailyStats', 'topBlocked']);
      
      // Update stat cards
      document.getElementById('totalBlocked').textContent = this.formatNumber(stats.totalBlocked || 0);
      
      // Mock data for demo - in real extension, this would come from actual tracking
      document.getElementById('todayBlocked').textContent = this.formatNumber(247);
      document.getElementById('weekBlocked').textContent = this.formatNumber(1834);
      document.getElementById('monthBlocked').textContent = this.formatNumber(7293);

      // Populate top blocked domains
      this.populateTopBlocked(stats.topBlocked || []);
      
      // Draw chart
      this.drawBlockingChart();
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  populateTopBlocked(topBlocked) {
    const list = document.getElementById('topBlockedList');
    list.innerHTML = '';

    // Mock data if no real data available
    const mockData = [
      { domain: 'doubleclick.net', count: 1247 },
      { domain: 'googlesyndication.com', count: 893 },
      { domain: 'googleadservices.com', count: 672 },
      { domain: 'amazon-adsystem.com', count: 451 },
      { domain: 'facebook.com', count: 329 }
    ];

    const dataToUse = topBlocked.length > 0 ? topBlocked : mockData;

    dataToUse.slice(0, 10).forEach(item => {
      const div = document.createElement('div');
      div.className = 'blocked-item';
      div.innerHTML = `
        <span class="blocked-domain">${item.domain}</span>
        <span class="blocked-count">${this.formatNumber(item.count)}</span>
      `;
      list.appendChild(div);
    });
  }

  drawBlockingChart() {
    const canvas = document.getElementById('blockingChart');
    const ctx = canvas.getContext('2d');
    
    // Mock chart data - in real extension, this would be actual data
    const data = [120, 245, 189, 301, 267, 198, 234];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Simple chart implementation
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...data);
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw data
    const barWidth = chartWidth / data.length;
    
    ctx.fillStyle = '#4facfe';
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * barWidth + barWidth * 0.1;
      const y = canvas.height - padding - barHeight;
      const width = barWidth * 0.8;
      
      ctx.fillRect(x, y, width, barHeight);
      
      // Draw labels
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], x + width / 2, canvas.height - padding + 15);
      ctx.fillStyle = '#4facfe';
    });
  }

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    // Insert at top of main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(message, mainContent.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 5000);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize options manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});