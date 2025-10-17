import React, { useState, useEffect } from 'react';
import { History, Play, Code, Download, Trash2, Upload, Search, Filter } from 'lucide-react';
import versionService from '../services/versionService';

const VersionHistory = ({ onVersionSelect }) => {
  const [versions, setVersions] = useState([]);
  const [filteredVersions, setFilteredVersions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState('all');
  const [filterTemplate, setFilterTemplate] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadVersions();
    loadStats();
  }, []);

  useEffect(() => {
    filterVersions();
  }, [versions, searchTerm, filterModel, filterTemplate]);

  const loadVersions = () => {
    const allVersions = versionService.getAllVersions();
    setVersions(allVersions);
  };

  const loadStats = () => {
    const versionStats = versionService.getVersionStats();
    setStats(versionStats);
  };

  const filterVersions = () => {
    let filtered = versions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.appIdea.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Model filter
    if (filterModel !== 'all') {
      filtered = filtered.filter(v => v.model === filterModel);
    }

    // Template filter
    if (filterTemplate !== 'all') {
      filtered = filtered.filter(v => v.template === filterTemplate);
    }

    setFilteredVersions(filtered);
  };

  const handleVersionSelect = (version) => {
    onVersionSelect(version);
  };

  const handleDeleteVersion = (id, event) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this version?')) {
      versionService.deleteVersion(id);
      loadVersions();
      loadStats();
    }
  };

  const handleExportVersion = (id, event) => {
    event.stopPropagation();
    versionService.exportVersion(id);
  };

  const handleImportVersion = (event) => {
    const file = event.target.files[0];
    if (file) {
      versionService.importVersion(file)
        .then(() => {
          loadVersions();
          loadStats();
          event.target.value = ''; // Reset file input
        })
        .catch(error => {
          alert('Import failed: ' + error.message);
        });
    }
  };

  const getUniqueModels = () => {
    const models = [...new Set(versions.map(v => v.model))];
    return models.sort();
  };

  const getUniqueTemplates = () => {
    const templates = [...new Set(versions.map(v => v.template))];
    return templates.sort();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Version History</h2>
          <p className="text-gray-300">
            {stats && `${stats.total} apps generated`}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportVersion}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4">
            <h4 className="font-semibold text-white mb-2">Total Apps</h4>
            <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4">
            <h4 className="font-semibold text-white mb-2">Most Used Model</h4>
            <p className="text-sm text-gray-300">
              {Object.entries(stats.models).sort((a, b) => b[1] - a[1])[0]?.[0]?.split('-')[0] || 'None'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4">
            <h4 className="font-semibold text-white mb-2">Popular Template</h4>
            <p className="text-sm text-gray-300 capitalize">
              {Object.entries(stats.templates).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4">
            <h4 className="font-semibold text-white mb-2">Last Generated</h4>
            <p className="text-sm text-gray-300">
              {stats.lastGenerated ? formatTimestamp(stats.lastGenerated) : 'Never'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Model Filter */}
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all" className="bg-gray-800">All Models</option>
            {getUniqueModels().map(model => (
              <option key={model} value={model} className="bg-gray-800">
                {model.split('-')[0]}
              </option>
            ))}
          </select>

          {/* Template Filter */}
          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all" className="bg-gray-800">All Templates</option>
            {getUniqueTemplates().map(template => (
              <option key={template} value={template} className="bg-gray-800 capitalize">
                {template}
              </option>
            ))}
          </select>

          {/* Results Count */}
          <div className="flex items-center text-gray-300">
            <Filter className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {filteredVersions.length} of {versions.length} apps
            </span>
          </div>
        </div>
      </div>

      {/* Version List */}
      <div className="space-y-4">
        {filteredVersions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              {versions.length === 0 ? 'No Apps Generated Yet' : 'No Apps Match Filters'}
            </h3>
            <p className="text-gray-500">
              {versions.length === 0 
                ? 'Generate your first app to see it here'
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        ) : (
          filteredVersions.map((version) => (
            <div
              key={version.id}
              onClick={() => handleVersionSelect(version)}
              className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6 hover:bg-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {version.appIdea}
                    </h3>
                    <div className={`px-2 py-1 rounded text-xs ${
                      version.isWorking 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {version.isWorking ? 'Working' : 'Fallback'}
                    </div>
                    {version.imported && (
                      <div className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">
                        Imported
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-300 mb-3">
                    <span>{formatTimestamp(version.timestamp)}</span>
                    <span>•</span>
                    <span>{version.model.split('-')[0]}</span>
                    <span>•</span>
                    <span className="capitalize">{version.template}</span>
                    <span>•</span>
                    <span>{version.code.split('\n').length} lines</span>
                    {version.blueprint && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">
                          Multi-pass
                        </span>
                      </>
                    )}
                    {version.stageRuns?.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-white/60">
                          {version.stageRuns.length} stages
                        </span>
                      </>
                    )}
                  </div>
                  
                  {version.blueprint && (
                    <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                      <span className="text-blue-300 font-medium">Blueprint: </span>
                      <span className="text-blue-200/80">{version.blueprint.summary || 'No summary available'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVersionSelect(version);
                    }}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    title="Open Preview"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => handleExportVersion(version.id, e)}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    title="Export"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteVersion(version.id, e)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
