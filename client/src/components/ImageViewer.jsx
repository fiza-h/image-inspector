import React from 'react';
import './ImageViewer.css';

const ImageViewer = ({ imagePath }) => {
    // Extract filename from the path provided in JSON
    // Example path: "images/train2017/2017_10035653.jpg" -> "2017_10035653.jpg"
    const filename = imagePath ? imagePath.split('/').pop() : null;

    // Construct URL for our backend (now serving static assets from public/data)
    const imageUrl = filename ? `/data/jpg/${filename}` : null;

    if (!imageUrl) {
        return <div className="image-viewer-placeholder">No Image Data</div>;
    }

    return (
        <div className="image-viewer">
            <img src={imageUrl} alt="Inspection Target" className="main-image" />
        </div>
    );
};

export default ImageViewer;
