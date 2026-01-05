import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImageViewer from './components/ImageViewer';
import MetadataViewer from './components/MetadataViewer';
import Controls from './components/Controls';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [files, setFiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [existingVotes, setExistingVotes] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE}/files`);
      // Sort files naturally if possible, or simple sort
      const sortedFiles = response.data.sort();
      setFiles(sortedFiles);
      if (sortedFiles.length > 0) {
        loadFile(sortedFiles[0]);
      }
    } catch (err) {
      setError('Failed to load file list');
      console.error(err);
    }
  };

  const loadFile = async (filename) => {
    setLoading(true);
    setError(null);
    setExistingVotes([]);

    try {
      const [fileResponse, votesResponse] = await Promise.all([
        axios.get(`${API_BASE}/file/${filename}`),
        axios.get(`${API_BASE}/votes/${filename}`)
      ]);

      setCurrentData(fileResponse.data);
      setExistingVotes(votesResponse.data);
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
      await axios.post(`${API_BASE}/vote`, {
        filename,
        ...voteData
      });
      console.log(`Voted for ${filename}`);

      // Update local state so if we switch users back, it knows we voted
      setExistingVotes(prev => [...prev, newVote]);

      if (currentIndex < files.length - 1) {
        handleNext();
      }
    } catch (err) {
      alert('Failed to save vote');
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Image Inspector</h1>
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
