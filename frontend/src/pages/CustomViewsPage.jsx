import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import VideoTimeline from '../components/VideoTimeline';
import SceneGallery from '../components/SceneGallery';
import SplitPointEditor from '../components/SplitPointEditor';
import BulkExportQueue from '../components/BulkExportQueue';
import api from '../utils/api';

const CustomViewsPage = () => {
  const [timeline, setTimeline] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [splitPoints, setSplitPoints] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tl, sc, sp] = await Promise.all([
          api.get('/custom-views/timeline?video_id=101'),
          api.get('/custom-views/scenes?video_id=101'),
          api.get('/custom-views/split-points'),
        ]);
        setTimeline(tl.data);
        setScenes(sc.data.scenes || []);
        setSplitPoints(sp.data.split_points || []);
      } catch (e) {
        setError(e.response?.data?.error || e.message || 'Failed to load custom views');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const availableClips = scenes.map((s) => ({ id: s.id, title: s.title }));

  return (
    <Layout>
      <div data-testid="custom-views-page">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h1 className="page-title">Video Views</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            Custom visualization and management for AI-detected scenes, split points, and bulk exports.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading && <div style={{ padding: 16, color: '#64748b' }}>Loading custom views...</div>}

        {!loading && (
          <>
            <section>
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>Video Timeline</h2>
              <VideoTimeline data={timeline} />
            </section>

            <section>
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>Scene Gallery</h2>
              <SceneGallery scenes={scenes} />
            </section>

            <section>
              <SplitPointEditor initialPoints={splitPoints} />
            </section>

            <section>
              <BulkExportQueue availableClips={availableClips} />
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};

export default CustomViewsPage;
