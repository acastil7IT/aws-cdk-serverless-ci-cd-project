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
        apiUrl: 'https://api.example.com', // This will be replaced by CDK deployment
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

    if (environmentEl) environmentEl.textContent = this.config.environment || 'Unknown';
    if (apiUrlEl) apiUrlEl.textContent = this.apiUrl || 'Not configured';
    if (versionEl) versionEl.textContent = this.config.version || '1.0.0';
  }

  async checkApiHealth() {
    const button = document.getElementById('health-check-btn');
    const statusDisplay = document.getElementById('health-status');
    
    if (!button || !statusDisplay) return;

    try {
      // Show loading state
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span>Checking...';
      statusDisplay.className = 'status-display show';
      statusDisplay.innerHTML = 'Checking API health...';

      const response = await fetch(`${this.apiUrl}/health`);
      const data = await response.json();

      if (response.ok && data.success) {
        statusDisplay.className = 'status-display show status-success';
        statusDisplay.innerHTML = `
          <h3>✅ API Health Check Passed</h3>
          <p><strong>Status:</strong> ${data.data.status}</p>
          <p><strong>Environment:</strong> ${data.data.environment}</p>
          <p><strong>Timestamp:</strong> ${new Date(data.data.timestamp).toLocaleString()}</p>
          <p><strong>Uptime:</strong> ${Math.round(data.data.uptime)} seconds</p>
        `;
      } else {
        throw new Error(data.message || 'Health check failed');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      statusDisplay.className = 'status-display show status-error';
      statusDisplay.innerHTML = `
        <h3>❌ API Health Check Failed</h3>
        <p><strong>Error:</strong> ${error.message}</p>
        <p>Please check the API configuration and try again.</p>
      `;
    } finally {
      button.disabled = false;
      button.innerHTML = 'Check API Health';
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
        <div class="status-display show status-error">
          <p>Failed to load items: ${error.message}</p>
        </div>
      `;
    } finally {
      button.disabled = false;
      button.innerHTML = 'Load Items';
    }
  }

  renderItems(items) {
    const container = document.getElementById('items-list');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="status-display show">
          <p>No items found. Add some items to get started!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="item-card fade-in">
        <div class="item-header">
          <h3 class="item-title">${this.escapeHtml(item.name)}</h3>
          <span class="item-id">ID: ${item.id}</span>
        </div>
        <p class="item-description">${this.escapeHtml(item.description)}</p>
        <div class="item-meta">
          <span>Created: ${new Date(item.createdAt).toLocaleDateString()}</span>
          <span>Updated: ${new Date(item.updatedAt).toLocaleDateString()}</span>
        </div>
        <div class="item-actions">
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