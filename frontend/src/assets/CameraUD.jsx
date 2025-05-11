import React, { useRef, useEffect } from "react";

const CameraModal = ({ isOpen, onCapture, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(blob => {
                onCapture(blob);
                stopCamera();
            }, 'image/jpeg');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content camera-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Take Photo for Location</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="camera-container">
                    <video ref={videoRef} autoPlay playsInline />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                <div className="camera-actions">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="capture-btn" onClick={capturePhoto}>
                        Capture
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraModal;