import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { X, Upload, CheckCircle } from 'lucide-react';
import { API_URL } from '../../utils/api';
import UploadDropZone from './UploadDropZone';
import UploadItem from './UploadItem';

const CONCURRENT_UPLOADS = 2; // Number of parallel uploads

const BatchUploadModal = ({ isOpen, onClose, projectId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploadStates, setUploadStates] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const uploadQueueRef = useRef([]);
  const activeUploadsRef = useRef(0);
  const cancelTokensRef = useRef({});

  const generateFileId = (file) => `${file.name}-${file.size}-${file.lastModified}`;

  const handleFilesAdded = useCallback((newFiles) => {
    const uniqueFiles = newFiles.filter(newFile => {
      const newId = generateFileId(newFile);
      return !files.some(f => generateFileId(f) === newId);
    });

    if (uniqueFiles.length > 0) {
      setFiles(prev => [...prev, ...uniqueFiles]);
      uniqueFiles.forEach(file => {
        const fileId = generateFileId(file);
        setUploadStates(prev => ({
          ...prev,
          [fileId]: { progress: 0, status: 'pending', error: null }
        }));
      });
    }
  }, [files]);

  const uploadFile = useCallback(async (file) => {
    const fileId = generateFileId(file);
    const cancelToken = axios.CancelToken.source();
    cancelTokensRef.current[fileId] = cancelToken;

    try {
      setUploadStates(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], status: 'uploading', progress: 0 }
      }));

      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      if (projectId) {
        formData.append('project_id', projectId);
      }

      const response = await axios.post(`${API_URL}/videos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        cancelToken: cancelToken.token,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadStates(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], progress }
          }));
        }
      });

      setUploadStates(prev => ({
        ...prev,
        [fileId]: { progress: 100, status: 'completed', error: null, videoId: response.data.id }
      }));

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        setUploadStates(prev => ({
          ...prev,
          [fileId]: { ...prev[fileId], status: 'pending', error: 'Cancelled' }
        }));
      } else {
        setUploadStates(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            status: 'failed',
            error: error.response?.data?.error || error.message
          }
        }));
      }
      throw error;
    } finally {
      delete cancelTokensRef.current[fileId];
    }
  }, [projectId]);

  const processQueue = useCallback(async () => {
    while (uploadQueueRef.current.length > 0 && activeUploadsRef.current < CONCURRENT_UPLOADS) {
      const file = uploadQueueRef.current.shift();
      if (!file) break;

      activeUploadsRef.current++;
      try {
        await uploadFile(file);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        activeUploadsRef.current--;
        // Process next file in queue
        processQueue();
      }
    }

    // Check if all uploads are complete
    if (uploadQueueRef.current.length === 0 && activeUploadsRef.current === 0) {
      setIsUploading(false);
    }
  }, [uploadFile]);

  const handleStartUpload = useCallback(() => {
    const pendingFiles = files.filter(file => {
      const fileId = generateFileId(file);
      return uploadStates[fileId]?.status === 'pending';
    });

    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    uploadQueueRef.current = [...pendingFiles];
    processQueue();
  }, [files, uploadStates, processQueue]);

  const handleCancel = useCallback((file) => {
    const fileId = generateFileId(file);

    // Cancel active upload
    if (cancelTokensRef.current[fileId]) {
      cancelTokensRef.current[fileId].cancel();
    }

    // Remove from queue
    uploadQueueRef.current = uploadQueueRef.current.filter(f => generateFileId(f) !== fileId);

    // Remove from files
    setFiles(prev => prev.filter(f => generateFileId(f) !== fileId));
    setUploadStates(prev => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
  }, []);

  const handleRetry = useCallback((file) => {
    const fileId = generateFileId(file);
    setUploadStates(prev => ({
      ...prev,
      [fileId]: { progress: 0, status: 'pending', error: null }
    }));

    if (isUploading) {
      uploadQueueRef.current.push(file);
      processQueue();
    }
  }, [isUploading, processQueue]);

  const handleClose = () => {
    // Cancel all active uploads
    Object.values(cancelTokensRef.current).forEach(source => source.cancel());
    cancelTokensRef.current = {};
    uploadQueueRef.current = [];
    activeUploadsRef.current = 0;

    // Check for completed uploads
    const completedUploads = files.filter(file => {
      const fileId = generateFileId(file);
      return uploadStates[fileId]?.status === 'completed';
    });

    if (completedUploads.length > 0 && onUploadComplete) {
      onUploadComplete(completedUploads.length);
    }

    setFiles([]);
    setUploadStates({});
    setIsUploading(false);
    onClose();
  };

  const completedCount = files.filter(f => uploadStates[generateFileId(f)]?.status === 'completed').length;
  const pendingCount = files.filter(f => uploadStates[generateFileId(f)]?.status === 'pending').length;
  const failedCount = files.filter(f => uploadStates[generateFileId(f)]?.status === 'failed').length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !isUploading && handleClose()}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title"><Upload size={24} /> Batch Upload Videos</h2>
          {!isUploading && <button className="modal-close" onClick={handleClose}><X size={24} /></button>}
        </div>
        <div className="modal-body">
          {/* Drop zone */}
          <UploadDropZone onFilesAdded={handleFilesAdded} disabled={isUploading} />

          {/* File list */}
          {files.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <h4 style={{ margin: 0, color: '#f8fafc' }}>
                  Files ({files.length})
                </h4>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  {completedCount > 0 && (
                    <span style={{ color: '#16a34a' }}>
                      <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {completedCount} completed
                    </span>
                  )}
                  {pendingCount > 0 && (
                    <span style={{ color: '#64748b' }}>{pendingCount} pending</span>
                  )}
                  {failedCount > 0 && (
                    <span style={{ color: '#dc2626' }}>{failedCount} failed</span>
                  )}
                </div>
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {files.map(file => {
                  const fileId = generateFileId(file);
                  const state = uploadStates[fileId] || { progress: 0, status: 'pending' };
                  return (
                    <UploadItem
                      key={fileId}
                      file={file}
                      progress={state.progress}
                      status={state.status}
                      error={state.error}
                      onCancel={handleCancel}
                      onRetry={handleRetry}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : completedCount > 0 ? 'Done' : 'Cancel'}
          </button>
          {pendingCount > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleStartUpload}
              disabled={isUploading}
            >
              <Upload size={18} />
              {isUploading ? 'Uploading...' : `Upload ${pendingCount} file${pendingCount > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchUploadModal;
