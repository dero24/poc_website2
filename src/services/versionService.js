import { v4 as uuidv4 } from 'https://esm.sh/uuid@9';

class VersionService {
  constructor() {
    this.storageKey = 'morphic-web-versions';
    this.currentAppKey = 'morphic-web-current';
  }

  saveVersion(appData) {
    const versions = this.getAllVersions();
    const version = {
      id: uuidv4(),
      timestamp: Date.now(),
      appIdea: appData.appIdea,
      model: appData.model,
      template: appData.template,
      code: appData.code,
      prompt: appData.prompt,
      isWorking: appData.isWorking ?? true,
      guardrails: appData.guardrails || null
    };

    versions.unshift(version); // Add to beginning
    
    // Keep only last 50 versions
    if (versions.length > 50) {
      versions.splice(50);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(versions));
    this.setCurrentApp(version);
    
    return version;
  }

  getAllVersions() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading versions:', error);
      return [];
    }
  }

  getVersion(id) {
    const versions = this.getAllVersions();
    return versions.find(v => v.id === id);
  }

  deleteVersion(id) {
    const versions = this.getAllVersions();
    const filtered = versions.filter(v => v.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return filtered;
  }

  setCurrentApp(version) {
    localStorage.setItem(this.currentAppKey, JSON.stringify(version));
  }

  getCurrentApp() {
    try {
      const stored = localStorage.getItem(this.currentAppKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading current app:', error);
      return null;
    }
  }

  clearCurrentApp() {
    localStorage.removeItem(this.currentAppKey);
  }

  updateVersion(id, patch = {}) {
    try {
      const versions = this.getAllVersions();
      const idx = versions.findIndex(v => v.id === id);
      if (idx === -1) return null;
      const updated = { ...versions[idx], ...(patch || {}) };
      versions[idx] = updated;
      localStorage.setItem(this.storageKey, JSON.stringify(versions));
      const current = this.getCurrentApp();
      if (current && current.id === id) {
        this.setCurrentApp(updated);
      }
      return updated;
    } catch (error) {
      console.error('updateVersion error:', error);
      return null;
    }
  }

  exportVersion(id) {
    const version = this.getVersion(id);
    if (!version) return null;

    const exportData = {
      ...version,
      exportedAt: Date.now(),
      exportedBy: 'Morphic Web'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morphic-app-${version.appIdea.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    return exportData;
  }

  importVersion(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          const version = {
            ...importData,
            id: uuidv4(), // New ID for imported version
            timestamp: Date.now(),
            imported: true
          };
          
          const versions = this.getAllVersions();
          versions.unshift(version);
          localStorage.setItem(this.storageKey, JSON.stringify(versions));
          
          resolve(version);
        } catch (error) {
          reject(new Error('Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }

  getVersionStats() {
    const versions = this.getAllVersions();
    const models = {};
    const templates = {};
    
    versions.forEach(v => {
      models[v.model] = (models[v.model] || 0) + 1;
      templates[v.template] = (templates[v.template] || 0) + 1;
    });

    return {
      total: versions.length,
      models,
      templates,
      lastGenerated: versions[0]?.timestamp || null
    };
  }
}

export default new VersionService();
