import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImageViewer from './components/ImageViewer';
import MetadataViewer from './components/MetadataViewer';
import Controls from './components/Controls';
import './App.css';

const API_BASE = '/api';

function App() {
  const [activeFolder, setActiveFolder] = useState('pipeline_output');
  const [files, setFiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [existingVotes, setExistingVotes] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, [activeFolder]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      // Fetch static file list from ACTIVE folder
      const response = await axios.get(`/data/${activeFolder}/files.json`);
      // Sort files naturally if possible, or simple sort
      const sortedFiles = response.data.sort();
      setFiles(sortedFiles);

      // Reset index
      setCurrentIndex(0);

      if (sortedFiles.length > 0) {
        loadFile(sortedFiles[0]);
      } else {
        // No files in this folder
        setCurrentData(null);
        setLoading(false);
      }
    } catch (err) {
      setError(`Failed to load file list from ${activeFolder}`);
      console.error(err);
      setLoading(false);
    }
  };

  const loadFile = async (filename) => {
    setLoading(true);
    setError(null);
    setExistingVotes([]);

    try {
      const fileResponse = await axios.get(`/data/${activeFolder}/${filename}`);
      setCurrentData(fileResponse.data);

      // Best effort to fetch votes
      try {
        const votesResponse = await axios.get(`${API_BASE}/votes/${filename}`);
        setExistingVotes(votesResponse.data);
      } catch (voteErr) {
        console.warn('Failed to fetch votes, assuming empty:', voteErr);
        setExistingVotes([]);
      }
    } catch (err) {
      setError(`Failed to load data for ${filename}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      loadFile(files[newIndex]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      loadFile(files[newIndex]);
    }
  };

  const handleSubmit = async (voteData) => {
    if (files.length === 0) return;
    const filename = files[currentIndex];

    // Optimistic update or wait for success
    const newVote = {
      user_name: voteData.user_name,
      filename,
      explicit_selected: voteData.explicit_selected,
      moderate_selected: voteData.moderate_selected,
      no_leak_selected: voteData.no_leak_selected,
      comments: voteData.comments
    };

    try {
      const res = await axios.post(`${API_BASE}/vote`, {
        ...voteData,
        filename: filename, // Use the local variable 'filename'
        dataset: activeFolder
      });
      // specific filename check to avoid double alert if necessary
      console.log(`Voted for ${filename}`);

      // DEBUG ALERT
      const debugInfo = res.data.receivedData;
      if (debugInfo) {
        alert(`DEBUG: Server received user=${debugInfo.user_name}, dataset=${debugInfo.dataset}, tab=${debugInfo.targetTab}`);
      } else {
        alert('Vote saved successfully!');
      }

      // Update local state so if we switch users back, it knows we voted
      setExistingVotes(prev => [...prev, newVote]);

      if (currentIndex < files.length - 1) {
        handleNext();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to save vote';
      alert(`Error: ${errorMessage}`);
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Image Inspector</h1>

        {/* DATASET TABS */}
        <div className="dataset-tabs" style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
          <button
            onClick={() => setActiveFolder('pipeline_output')}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              background: activeFolder === 'pipeline_output' ? '#3B82F6' : '#E5E7EB',
              color: activeFolder === 'pipeline_output' ? 'white' : 'black',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Pipeline Output
          </button>
          <button
            onClick={() => setActiveFolder('irtiza_output')}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              background: activeFolder === 'irtiza_output' ? '#3B82F6' : '#E5E7EB',
              color: activeFolder === 'irtiza_output' ? 'white' : 'black',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            OG Gemini Selected
          </button>
        </div>
        <div className="file-info">
          {files.length > 0 ? `${currentIndex + 1} / ${files.length}` : '0 / 0'}
          <span className="current-filename">{files[currentIndex]}</span>
        </div>
      </header>

      <main className="main-content">
        {error && <div className="error-banner">{error}</div>}

        <div className="content-grid">
          <div className="image-column">
            {loading ? <div className="loading">Loading Image...</div> : (
              <ImageViewer imagePath={currentData?.image?.image_path} />
            )}
          </div>

          <div className="info-column">
            {loading ? <div className="loading">Loading Data...</div> : (
              <MetadataViewer data={currentData} />
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <Controls
          key={currentIndex}
          onNext={handleNext}
          onPrev={handlePrev}
          onSubmit={handleSubmit}
          hasNext={currentIndex < files.length - 1}
          hasPrev={currentIndex > 0}
          existingVotes={existingVotes}
        />
      </footer>
    </div>
  );
}

export default App;
