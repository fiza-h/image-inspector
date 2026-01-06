import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, Check, X, CheckCircle2 } from 'lucide-react';
import './Controls.css';

const Controls = ({ onNext, onPrev, hasNext, hasPrev }) => {
    return (
        <div className="controls-wrapper" style={{ justifyContent: 'center', gap: '40px', padding: '20px' }}>
            <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="nav-btn prev"
                title="Previous Image"
                style={{ position: 'static' }} // Override specific positioning if any
            >
                <ArrowLeft size={32} />
            </button>

            <button
                onClick={onNext}
                disabled={!hasNext}
                className="nav-btn next"
                title="Next Image"
                style={{ position: 'static' }}
            >
                <ArrowRight size={32} />
            </button>
        </div>
    );
};

export default Controls;
