import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { SPLIT_PRESETS } from '../../utils/constants';

const ProjectSettings = ({ settings, onSave, disabled = false }) => {
  const [localSettings, setLocalSettings] = useState({
    defaultSplitType: 'smart',
    defaultPreset: 'medium',
    minClipDuration: 300,
    maxClipDuration: 900,
    autoSplit: false,
    exportFormat: 'mp4',
    exportResolution: '1920x1080'
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handlePresetChange = (preset) => {
    handleChange('defaultPreset', preset);
    if (preset !== 'custom' && SPLIT_PRESETS[preset]) {
      handleChange('minClipDuration', SPLIT_PRESETS[preset].min);
      handleChange('maxClipDuration', SPLIT_PRESETS[preset].max);
    }
  };

  const handleSave = () => {
    onSave?.(localSettings);
    setHasChanges(false);
  };

  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 8,
      padding: 20
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20
      }}>
        <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={20} />
          Default Settings
        </h3>
        {hasChanges && (
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={disabled}
            style={{ padding: '8px 16px' }}
          >
            <Save size={16} /> Save Changes
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Default Split Type</label>
          <select
            className="form-input"
            value={localSettings.defaultSplitType}
            onChange={(e) => handleChange('defaultSplitType', e.target.value)}
            disabled={disabled}
          >
            <option value="smart">Smart Split (Silence Detection)</option>
            <option value="time">Time-based (Fixed Intervals)</option>
            <option value="scene">Scene Detection</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Duration Preset</label>
          <select
            className="form-input"
            value={localSettings.defaultPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={disabled}
          >
            {Object.entries(SPLIT_PRESETS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Min Clip Duration (seconds)</label>
          <input
            type="number"
            className="form-input"
            value={localSettings.minClipDuration}
            onChange={(e) => {
              handleChange('defaultPreset', 'custom');
              handleChange('minClipDuration', parseInt(e.target.value) || 60);
            }}
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Max Clip Duration (seconds)</label>
          <input
            type="number"
            className="form-input"
            value={localSettings.maxClipDuration}
            onChange={(e) => {
              handleChange('defaultPreset', 'custom');
              handleChange('maxClipDuration', parseInt(e.target.value) || 600);
            }}
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Export Format</label>
          <select
            className="form-input"
            value={localSettings.exportFormat}
            onChange={(e) => handleChange('exportFormat', e.target.value)}
            disabled={disabled}
          >
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
            <option value="mov">MOV</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Export Resolution</label>
          <select
            className="form-input"
            value={localSettings.exportResolution}
            onChange={(e) => handleChange('exportResolution', e.target.value)}
            disabled={disabled}
          >
            <option value="1920x1080">1080p (1920x1080)</option>
            <option value="1280x720">720p (1280x720)</option>
            <option value="1080x1920">Vertical 1080p</option>
            <option value="1080x1080">Square (1080x1080)</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={localSettings.autoSplit}
            onChange={(e) => handleChange('autoSplit', e.target.checked)}
            disabled={disabled}
          />
          <span style={{ color: '#f8fafc' }}>Auto-split videos on upload</span>
        </label>
      </div>
    </div>
  );
};

export default ProjectSettings;
