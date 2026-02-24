import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import "../styles/Admin.css";
import "../styles/Employee.css";
import api from '../api/axios';

const Feedback = ({ caseData, onClose, onSubmitted }) => {
    const [photo, setPhoto] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [metaData, setMetaData] = useState({ location: '', time: '' });
    const [feedback, setFeedback] = useState({
        accId: caseData?.acc_id || '', code: '', whoMet: '', metName: '', relation: '',
        place: '', customPlace: '', distance: '', assetAvailable: 'yes',
        assetLocation: '', assetStatus: '', nextActionDate: '', fullFeedback: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        setFeedback(prev => ({ ...prev, accId: caseData?.acc_id || '' }));
    }, [caseData?.acc_id]);

    const codes = ["Paid", "PTP", "RTP", "Not Available", "Third Person (family)", "Third Person (other)", "ANF"];
    const relations = ["Customer", "Husband", "Wife", "Father", "Mother", "Brother", "Sister", "Cousin", "Mother-in-law", "Father-in-law", "Neighbour", "Landlord", "Office Person", "Sister-in-law", "Brother-in-law", "Friend", "Son", "Daughter", "Someone else"];

    const handleCapturePhoto = (e) => {
        const file = e.target.files[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPhoto(objectUrl);
            setPhotoFile(file);
            const now = new Date().toLocaleString();

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    setMetaData({
                        time: now,
                        location: `LAT: ${pos.coords.latitude.toFixed(4)} | LON: ${pos.coords.longitude.toFixed(4)}`
                    });
                }, () => {
                    setMetaData({ time: now, location: "GPS Access Denied" });
                });
            } else {
                setMetaData({ time: now, location: "GPS Not Available" });
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFeedback(prev => ({ ...prev, [name]: value }));
    };

    const isReadyToSubmit = () => {
        const base = feedback.accId && feedback.code && feedback.whoMet && feedback.place && feedback.fullFeedback && photoFile;
        const metReq = feedback.whoMet === "Customer" || (feedback.metName && (feedback.whoMet !== "Someone else" || feedback.relation));
        const placeReq = feedback.place !== "Anywhere else" || (feedback.customPlace && feedback.distance);
        const assetReq = feedback.assetAvailable === "yes" || (feedback.assetLocation && feedback.assetStatus);
        const dateReq = feedback.code === "Paid" || feedback.nextActionDate;
        return base && metReq && placeReq && assetReq && dateReq;
    };

    const downloadImageWithMetadata = async () => {
        if (!photo) return null;
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = photo;

            await new Promise((res, rej) => {
                img.onload = res;
                img.onerror = rej;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxWidth = 1200;
            const scale = img.width > maxWidth ? maxWidth / img.width : 1;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale + 80;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height - 80);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
            ctx.fillStyle = '#fff';
            ctx.font = '18px sans-serif';
            ctx.textBaseline = 'middle';
            const metaText = `${metaData.time || ''}    ${metaData.location || ''}`;
            const padding = 12;

            const wrapText = (ctxLocal, text, x, y, maxW, lineH) => {
                const words = text.split(' ');
                let line = '';
                let curY = y;
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctxLocal.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxW && n > 0) {
                        ctxLocal.fillText(line, x, curY);
                        line = words[n] + ' ';
                        curY += lineH;
                    } else {
                        line = testLine;
                    }
                }
                ctxLocal.fillText(line, x, curY);
            };

            wrapText(ctx, metaText, padding, canvas.height - 40, canvas.width - padding * 2, 22);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            const fileNameTime = (metaData.time || new Date().toISOString()).replace(/[:\s,\/]/g, '_');
            link.download = `visit_photo_${fileNameTime}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            link.remove();
            return dataUrl;
        } catch (err) {
            console.error('Failed to generate/download image:', err);
            return null;
        }
    };

    const composeWhatsAppMessage = () => {
        const parts = [];
        parts.push(`Visit Feedback`);
        parts.push(`Account ID: ${feedback.accId}`);
        parts.push(`Code: ${feedback.code}`);
        parts.push(`Who Met: ${feedback.whoMet}`);
        if (feedback.metName) parts.push(`Person Name: ${feedback.metName}`);
        if (feedback.relation) parts.push(`Relation: ${feedback.relation}`);
        parts.push(`Place: ${feedback.place}`);
        if (feedback.customPlace) parts.push(`Location Details: ${feedback.customPlace}`);
        if (feedback.distance) parts.push(`Distance: ${feedback.distance}`);
        parts.push(`Asset Available: ${feedback.assetAvailable}`);
        if (feedback.assetLocation) parts.push(`Asset Location: ${feedback.assetLocation}`);
        if (feedback.assetStatus) parts.push(`Asset Status: ${feedback.assetStatus}`);
        if (feedback.nextActionDate) parts.push(`Next Action Date: ${feedback.nextActionDate}`);
        parts.push(`Observations: ${feedback.fullFeedback}`);
        parts.push(`Captured At: ${metaData.time || ''}`);
        parts.push(`GPS: ${metaData.location || ''}`);

        return parts.join('\n');
    };

    const { user } = useContext(AuthContext);

    const copyToClipboard = () => {
        const rawText = generateReportText().replace(/%0A/g, '\n').replace(/\*/g, '');
        navigator.clipboard.writeText(rawText);
        setSuccess('Report copied to clipboard!');
        setTimeout(() => setSuccess(null), 2000);
    };

   const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isReadyToSubmit()) return;

    try {
        setSubmitting(true);
        const formDataToSend = new FormData();
        formDataToSend.append('caseId', caseData.id);
        formDataToSend.append('lat', metaData.location?.match(/LAT:\s*([0-9.-]+)/)?.[1] || '');
        formDataToSend.append('lng', metaData.location?.match(/LON:\s*([0-9.-]+)/)?.[1] || '');
        formDataToSend.append('visit_code', feedback.code || '');
        formDataToSend.append('meeting_place', feedback.place || '');
        formDataToSend.append('customPlace', feedback.customPlace || '');
        formDataToSend.append('distance', feedback.distance || '');
        formDataToSend.append('whoMet', feedback.whoMet || '');
        formDataToSend.append('metName', feedback.metName || '');
        formDataToSend.append('relation', feedback.relation || '');
        formDataToSend.append('asset_available', feedback.assetAvailable || '');
        formDataToSend.append('asset_location', feedback.assetLocation || '');
        formDataToSend.append('asset_status', feedback.assetAvailable === 'yes' ? 'AVAILABLE' : (feedback.assetStatus || 'UNKNOWN'));
        formDataToSend.append('remarks', feedback.fullFeedback || '');
        if (feedback.nextActionDate) formDataToSend.append('ptp_date', feedback.nextActionDate);
        if (photoFile) formDataToSend.append('photo', photoFile, photoFile.name || 'photo.jpg');

        const res = await api.post('/feedbacks', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.status === 200 || res.data.success) {
            setSuccess('Data Pushed to Base!');
            
            // 1. Download image locally
            await downloadImageWithMetadata();

            // 2. Open WhatsApp with formatted template
            const message = composeWhatsAppMessage();
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            // 3. Notify Dashboard to refresh and close
            if (onSubmitted) {
                onSubmitted(); // This closes the modal in your Dashboard
            }
        }
    } catch (err) {
        console.error(err);
        setError('Failed to submit feedback.');
    } finally {
        setSubmitting(false);
    }
};

    return (
        <div className="admin-root employee-view">
            <div className="admin-container">
                <header className="admin-header">
                    <div className="fun-header-text">
                        <h1 className="text-white">Field Pro 🛰️</h1>
                        <p className="text-slate-400">Secure Evidence-Based Reporting</p>
                    </div>
                </header>

                <div className="employee-grid">
                    <main className="feedback-section">
                        <div className="feedback-form-card shadow-2xl">
                            <h2 className="section-title border-b border-slate-800 pb-4">New Visit Entry</h2>

                            <form className="employee-form" onSubmit={handleSubmit}>

                                <div className="photo-upload-zone">
                                    <label className="input-label">Live Site Photo (Required) *</label>

                                    <div className={`camera-box ${!photo ? 'pending' : 'captured'}`}>
                                        {photo ? (
                                            <div className="photo-wrap">
                                                <img src={photo} alt="Preview" className="captured-img" />
                                                <div className="meta-info">
                                                    <span>📍 {metaData.location}</span>
                                                    <span>⏰ {metaData.time}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setPhoto(null)}
                                                    className="clear-photo"
                                                >
                                                    Retake
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="camera-ui">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    onChange={handleCapturePhoto}
                                                    required
                                                />
                                                <div className="camera-plus">📸</div>
                                                <p>Tap to Snap Evidence</p>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="field-group">
                                    <div className="input-box">
                                        <label className="input-label">Account ID *</label>
                                        <input
                                            type="text"
                                            name="accId"
                                            className="emp-input"
                                            placeholder="ID Number"
                                            value={feedback.accId}
                                            onChange={handleInputChange}
                                            required
                                            readOnly
                                        />
                                    </div>

                                    <div className="input-box">
                                        <label className="input-label">Visit Code *</label>
                                        <select
                                            name="code"
                                            className="emp-select"
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">-- Select --</option>
                                            {codes.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="field-group">
                                    <div className="input-box">
                                        <label className="input-label">Who Met? *</label>
                                        <select
                                            name="whoMet"
                                            className="emp-select"
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">-- Select --</option>
                                            {relations.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {feedback.whoMet && feedback.whoMet !== "Customer" && (
                                        <div className="input-box">
                                            <label className="input-label">Person Name *</label>
                                            <input
                                                type="text"
                                                name="metName"
                                                className="emp-input"
                                                placeholder="Enter Name"
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                {feedback.whoMet === "Someone else" && (
                                    <div className="input-box full-width">
                                        <label className="input-label">Relationship Description *</label>
                                        <input
                                            type="text"
                                            name="relation"
                                            className="emp-input"
                                            placeholder="Describe relation"
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="field-group">
                                    <div className="input-box">
                                        <label className="input-label">Meeting Place *</label>
                                        <select
                                            name="place"
                                            className="emp-select"
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">-- Select --</option>
                                            <option value="Home">Home</option>
                                            <option value="Office">Office</option>
                                            <option value="Farm">Farm</option>
                                            <option value="Anywhere else">Anywhere else</option>
                                        </select>
                                    </div>

                                    {feedback.place === "Anywhere else" && (
                                        <div className="input-box">
                                            <label className="input-label">Distance *</label>
                                            <input
                                                type="text"
                                                name="distance"
                                                className="emp-input"
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                {feedback.place === "Anywhere else" && (
                                    <div className="input-box full-width">
                                        <label className="input-label">Specify Location *</label>
                                        <input
                                            type="text"
                                            name="customPlace"
                                            className="emp-input"
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="asset-card">
                                    <label className="input-label">Asset Status *</label>
                                    <div className="radio-flex">
                                        <label className="radio-btn">
                                            <input
                                                type="radio"
                                                name="assetAvailable"
                                                value="yes"
                                                checked={feedback.assetAvailable === 'yes'}
                                                onChange={handleInputChange}
                                            />
                                            <span>Yes</span>
                                        </label>
                                        <label className="radio-btn">
                                            <input
                                                type="radio"
                                                name="assetAvailable"
                                                value="no"
                                                checked={feedback.assetAvailable === 'no'}
                                                onChange={handleInputChange}
                                            />
                                            <span>No</span>
                                        </label>
                                    </div>

                                    {feedback.assetAvailable === 'no' && (
                                        <div className="nested-fields">
                                            <input
                                                type="text"
                                                name="assetLocation"
                                                className="emp-input"
                                                placeholder="Current location"
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <select
                                                name="assetStatus"
                                                className="emp-select"
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Reason...</option>
                                                <option value="Sold">Sold</option>
                                                <option value="Stolen">Stolen</option>
                                                <option value="Pledged">Pledged</option>
                                            </select>
                                        </div>
                                    )}

                                </div>

                                {feedback.code !== "Paid" && (
                                    <div className="input-box full-width">
                                        <label className="input-label">Next Action Date *</label>
                                        <input
                                            type="date"
                                            name="nextActionDate"
                                            className="emp-input"
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="input-box full-width">
                                    <label className="input-label">Visit Observations *</label>
                                    <textarea
                                        name="fullFeedback"
                                        className="emp-area"
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="submit-heavy-btn"
                                    disabled={!isReadyToSubmit() || submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Push Data to Base ✨'}
                                </button>
                                <button type="button" onClick={copyToClipboard} style={{ flex: 1, background: '#475569', padding: '12px', border: 'none', borderRadius: '6px', color: 'white' }}>
                        📋 Copy
                    </button>

                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
