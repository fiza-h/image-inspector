import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, Check, X, CheckCircle2 } from 'lucide-react';
import './Controls.css';

const USERS = ['fiza', 'irtiza', 'ahsan', 'alina'];
const CAPTION_TYPES = ['explicit', 'moderate', 'no_leak'];

const Controls = ({ onNext, onPrev, onSubmit, hasNext, hasPrev, existingVotes = [] }) => {
    const [user, setUser] = useState('');
    const [captionVotes, setCaptionVotes] = useState({
        explicit: '',
        moderate: '',
        no_leak: ''
    });
    const [comment, setComment] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (!user) {
            resetForm();
            return;
        }

        const userVote = existingVotes.find(v => v.user_name === user);
        if (userVote) {
            setCaptionVotes({
                explicit: userVote.explicit_selected,
                moderate: userVote.moderate_selected,
                no_leak: userVote.no_leak_selected
            });
            setComment(userVote.comments || '');
            setIsSubmitted(true);
        } else {
            resetForm(true);
        }
    }, [user, existingVotes]);

    const resetForm = (keepUser = false) => {
        setCaptionVotes({
            explicit: '',
            moderate: '',
            no_leak: ''
        });
        setComment('');
        setIsSubmitted(false);
        if (!keepUser) setUser('');
    };

    const handleCaptionVote = (type, vote) => {
        if (isSubmitted) return;
        setCaptionVotes(prev => ({ ...prev, [type]: vote }));
    };

    const handleSubmit = () => {
        if (!user) {
            alert('Please select a user');
            return;
        }

        onSubmit({
            user_name: user,
            explicit_selected: captionVotes.explicit || 'none',
            moderate_selected: captionVotes.moderate || 'none',
            no_leak_selected: captionVotes.no_leak || 'none',
            comments: comment
        });
        setIsSubmitted(true);
    };

    return (
        <div className="controls-wrapper">
            <button onClick={onPrev} disabled={!hasPrev} className="nav-btn prev" title="Previous Image">
                <ArrowLeft size={32} />
            </button>

            <div className="controls-card">
                <div className="controls-section user-section">
                    <span className="label">Select User</span>
                    <div className="user-pills">
                        {USERS.map(u => (
                            <label key={u} className={`user-pill ${user === u ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="user"
                                    value={u}
                                    checked={user === u}
                                    onChange={(e) => setUser(e.target.value)}
                                />
                                {u}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="controls-section captions-section">
                    {CAPTION_TYPES.map(type => (
                        <div key={type} className="caption-row">
                            <span className="caption-name">{type.replace('_', ' ')}</span>
                            <div className="vote-toggles">
                                <button
                                    className={`vote-btn accept ${captionVotes[type] === 'accepted' ? 'active' : ''} ${isSubmitted ? 'disabled' : ''}`}
                                    onClick={() => handleCaptionVote(type, 'accepted')}
                                    disabled={isSubmitted}
                                >
                                    <Check size={16} /> Accept
                                </button>
                                <button
                                    className={`vote-btn reject ${captionVotes[type] === 'rejected' ? 'active' : ''} ${isSubmitted ? 'disabled' : ''}`}
                                    onClick={() => handleCaptionVote(type, 'rejected')}
                                    disabled={isSubmitted}
                                >
                                    <X size={16} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="controls-section comment-section">
                    <input
                        type="text"
                        placeholder={isSubmitted ? "No comment" : "Add a comment..."}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="comment-input"
                        disabled={isSubmitted}
                    />
                </div>

                <div className="controls-section action-section">
                    {isSubmitted ? (
                        <div className="status-badge success">
                            <CheckCircle2 size={18} />
                            <span>Input already given</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="submit-btn"
                            disabled={!user}
                        >
                            <Save size={18} />
                            Save Response
                        </button>
                    )}
                </div>
            </div>

            <button onClick={onNext} disabled={!hasNext} className="nav-btn next" title="Next Image">
                <ArrowRight size={32} />
            </button>
        </div>
    );
};

export default Controls;
