import React from 'react';
import FeaturePage from './FeaturePage';
import { StatusIcon } from '../components/common';

const AIAnalysisPage = () => (
  <FeaturePage title="AI Analyses" endpoint="ai-analysis" type="ai-analysis"
    cardRender={(item, onClick) => (
      <div key={item.id} className="card" onClick={onClick}>
        <div className="card-content">
          <div className="card-header-row"><h3 className="card-title">{item.analysis_type.replace(/_/g, ' ')}</h3><StatusIcon status={item.status} /></div>
          <p className="card-description">Video: {item.video_title || '-'}</p>
          <p className="card-description">Model: {item.model_used}</p>
          <div className="card-meta">
            <span>{item.confidence_score ? `${(item.confidence_score * 100).toFixed(0)}% confidence` : '-'}</span>
            <span>{item.processing_time ? `${item.processing_time}s` : '-'}</span>
          </div>
        </div>
      </div>
    )}
    fields={[
      { name: 'analysis_type', label: 'Analysis Type', type: 'select', options: ['scene_detection', 'highlight_detection', 'sentiment_analysis', 'keyword_extraction', 'viral_potential'] },
      { name: 'model_used', label: 'AI Model', type: 'select', options: ['openai/gpt-4-turbo', 'anthropic/claude-3-opus', 'anthropic/claude-3-haiku'] }
    ]}
  />
);

export default AIAnalysisPage;
