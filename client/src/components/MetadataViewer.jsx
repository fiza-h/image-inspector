import React from 'react';
import './MetadataViewer.css';

const MetadataViewer = ({ data }) => {
    if (!data || !data.image) return <div className="metadata-placeholder">No Metadata</div>;

    const { id, labels, florence_captions } = data.image;
    const { caption, detailed_caption, more_detailed_caption } = florence_captions || {};
    const privacy = data.privacy_reasoning;

    return (
        <div className="metadata-viewer">
            <div className="meta-section">
                <h3>Image Details</h3>
                <p><strong>ID:</strong> {id}</p>
                <p><strong>Labels:</strong> {labels ? labels.join(', ') : 'None'}</p>
            </div>

            <div className="meta-section">
                <h3>Captions</h3>
                {caption && <p><strong>Caption:</strong> {caption['<CAPTION>']}</p>}
                {detailed_caption && <p><strong>Detailed:</strong> {detailed_caption['<DETAILED_CAPTION>']}</p>}
            </div>

            {privacy && (
                <div className="meta-section privacy-section">
                    <h3>Privacy Reasoning</h3>

                    {privacy.anchor && (
                        <div className="privacy-block">
                            <h4>Anchor</h4>
                            <p><strong>Label:</strong> {privacy.anchor.label}</p>
                            <p><strong>Risk Score:</strong> {privacy.anchor.risk_score} ({privacy.anchor.tier})</p>
                        </div>
                    )}

                    {privacy.w_completeness && (
                        <div className="privacy-block">
                            <h4>Completeness</h4>
                            {privacy.w_completeness.selected_piis && privacy.w_completeness.selected_piis.map((pii, idx) => (
                                <div key={idx} className="pii-item">
                                    <span className={`tier-badge ${pii.tier}`}>{pii.tier}</span>
                                    <span><strong>{pii.w}:</strong> {pii.label} ({pii.value})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {data.generated_captions && (
                <div className="meta-section">
                    <h3>Generated Captions</h3>
                    <p className="model-name"><strong>Model:</strong> {data.generated_captions.model}</p>
                    <div className="generated-captions-grid">
                        <div className="caption-box explicit">
                            <h4>Explicit</h4>
                            <p>{data.generated_captions.output.explicit}</p>
                        </div>
                        <div className="caption-box moderate">
                            <h4>Moderate</h4>
                            <p>{data.generated_captions.output.moderate}</p>
                        </div>
                        <div className="caption-box no-leak">
                            <h4>No Leak</h4>
                            <p>{data.generated_captions.output.no_leak}</p>
                        </div>
                    </div>
                </div>
            )}

            {data.selection && (
                <div className="meta-section selection-details">
                    <h3>Selected Persona Details</h3>
                    <div className="selection-info">
                        <p><strong>Reasoning:</strong> {data.selection.match_reason}</p>
                        {data.selection.candidates && (
                            <p><strong>Score:</strong> {
                                data.selection.candidates.find(c => c.selected_persona_id === data.selection.selected_persona_id)?.score || 'N/A'
                            }</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MetadataViewer;
