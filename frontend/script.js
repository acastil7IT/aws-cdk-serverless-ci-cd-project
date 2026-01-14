/**
 * DevOps Portfolio Project - Frontend JavaScript
 * 
 * This script demonstrates:
 * - API integration with error handling
 * - Dynamic content loading
 * - Modern JavaScript patterns
 * - User experience best practices
 */

class DevOpsPortfolioApp {
  constructor() {
    this.config = null;
    this.apiUrl = '';
    this.init();
  }

  async init() {
    try {
      // Load configuration
      await this.loadConfig();
      
      // Initialize UI
      this.initializeEventListeners();
      this.updateEnvironmentInfo();
      
      // Load initial data
      await this.checkApiHealth();
      
      console.log('DevOps Portfolio App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize application');
    }
  }

  async loadConfig() {
    try {
      const response = await fetch('/config.json');
      if (!response.ok) {
        throw new Error('Failed to load configuration');
      }
      this.config = await response.json();
      this.apiUrl = this.config.apiUrl;
      console.log('Configuration loaded:', this.config);
    } catch (error) {
      console.warn('Could not load config.json, using fallback configuration');
      // Fallback configuration for local development
      this.config = {
        apiUrl: 'https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev',
        environment: 'local',
        version: '1.0.0'
      };
      this.apiUrl = this.config.apiUrl;
    }
  }

  initializeEventListeners() {
    // Health check button
    const healthCheckBtn = document.getElementById('health-check-btn');
    healthCheckBtn?.addEventListener('click', () => this.checkApiHealth());

    // Load items button
    const loadItemsBtn = document.getElementById('load-items-btn');
    loadItemsBtn?.addEventListener('click', () => this.loadItems());

    // Add item button
    const addItemBtn = document.getElementById('add-item-btn');
    addItemBtn?.addEventListener('click', () => this.showAddItemForm());
  }

  updateEnvironmentInfo() {
    const environmentEl = document.getElementById('environment');
    const apiUrlEl = document.getElementById('api-url');
    const versionEl = document.getElementById('version');
    const envBadge = document.getElementById('env-badge');

    const env = this.config.environment || 'Unknown';
    
    if (environmentEl) environmentEl.textContent = env.toUpperCase();
    if (apiUrlEl) apiUrlEl.textContent = this.apiUrl || 'Not configured';
    if (versionEl) versionEl.textContent = this.config.version || '1.0.0';
    if (envBadge) {
      envBadge.textContent = env.toUpperCase();
      envBadge.style.background = env === 'prod' ? '#dc2626' : '#3b82f6';
    }
  }

  async checkApiHealth() {
    const button = document.getElementById('health-check-btn');
    const statusDisplay = document.getElementById('health-status');
    const apiStatusText = document.getElementById('api-status-text');
    const apiUptime = document.getElementById('api-uptime');
    const responseTimeEl = document.getElementById('response-time');
    
    if (!button || !statusDisplay) return;

    try {
      // Show loading state
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span>Checking...';
      statusDisplay.className = 'result-panel show';
      statusDisplay.innerHTML = 'Running health check...';

      const startTime = performance.now();
      const response = await fetch(`${this.apiUrl}/health`);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      const data = await response.json();

      if (response.ok && data.success) {
        statusDisplay.className = 'result-panel show success';
        statusDisplay.innerHTML = `
          <h3>System Health: Operational</h3>
          <p><strong>Status:</strong> ${data.data.status}</p>
          <p><strong>Environment:</strong> ${data.data.environment}</p>
          <p><strong>Timestamp:</strong> ${new Date(data.data.timestamp).toLocaleString()}</p>
          <p><strong>Uptime:</strong> ${Math.round(data.data.uptime)} seconds</p>
          <p><strong>Response Time:</strong> ${responseTime} ms</p>
        `;
        
        if (apiStatusText) apiStatusText.textContent = 'Healthy';
        if (apiUptime) apiUptime.textContent = `Uptime: ${Math.round(data.data.uptime)}s`;
        if (responseTimeEl) responseTimeEl.textContent = `${responseTime} ms`;
      } else {
        throw new Error(data.message || 'Health check failed');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      statusDisplay.className = 'result-panel show error';
      statusDisplay.innerHTML = `
        <h3>System Health: Error</h3>
        <p><strong>Error:</strong> ${error.message}</p>
        <p>Unable to connect to the API. Please check the configuration and try again.</p>
      `;
      
      if (apiStatusText) apiStatusText.textContent = 'Error';
    } finally {
      button.disabled = false;
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        Run Health Check
      `;
    }
  }
  async loadItems() {
    const button = document.getElementById('load-items-btn');
    const container = document.getElementById('items-list');
    
    if (!button || !container) return;

    try {
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span>Loading...';
      
      const response = await fetch(`${this.apiUrl}/api/v1/items`);
      const data = await response.json();

      if (response.ok && data.success) {
        this.renderItems(data.data.items);
      } else {
        throw new Error(data.message || 'Failed to load items');
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      container.innerHTML = `
        <div class="result-panel show error">
          <p>Failed to load data: ${error.message}</p>
        </div>
      `;
    } finally {
      button.disabled = false;
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh Data
      `;
    }
  }

  renderItems(items) {
    const container = document.getElementById('items-list');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="result-panel show">
          <p>No data entries found. Add new entries to get started.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="data-card">
        <div class="data-card-header">
          <h3 class="data-title">${this.escapeHtml(item.name)}</h3>
          <span class="data-id">ID: ${item.id}</span>
        </div>
        <p class="data-description">${this.escapeHtml(item.description)}</p>
        <div class="data-meta">
          <span>Created: ${new Date(item.createdAt).toLocaleDateString()}</span>
          <span>Updated: ${new Date(item.updatedAt).toLocaleDateString()}</span>
        </div>
        <div class="data-actions">
          <button class="btn btn-secondary btn-small" onclick="app.editItem('${item.id}')">
            Edit
          </button>
          <button class="btn btn-danger btn-small" onclick="app.deleteItem('${item.id}')">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  showAddItemForm() {
    const name = prompt('Enter item name:');
    if (!name) return;

    const description = prompt('Enter item description:');
    if (!description) return;

    this.createItem({ name, description });
  }

  async createItem(itemData) {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Item created successfully!');
        this.loadItems(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to create item');
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      alert(`Failed to create item: ${error.message}`);
    }
  }

  async editItem(id) {
    try {
      // First, get the current item data
      const response = await fetch(`${this.apiUrl}/api/v1/items/${id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error('Failed to load item data');
      }

      const item = data.data.item;
      const name = prompt('Enter new name:', item.name);
      if (name === null) return; // User cancelled

      const description = prompt('Enter new description:', item.description);
      if (description === null) return; // User cancelled

      await this.updateItem(id, { name, description });
    } catch (error) {
      console.error('Failed to edit item:', error);
      alert(`Failed to edit item: ${error.message}`);
    }
  }

  async updateItem(id, itemData) {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Item updated successfully!');
        this.loadItems(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to update item');
      }
    } catch (error) {
      console.error('Failed to update item:', error);
      alert(`Failed to update item: ${error.message}`);
    }
  }

  async deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/items/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Item deleted successfully!');
        this.loadItems(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert(`Failed to delete item: ${error.message}`);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    console.error(message);
    // You could implement a toast notification system here
    alert(message);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new DevOpsPortfolioApp();
});