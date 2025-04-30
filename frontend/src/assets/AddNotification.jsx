import { useState } from 'react';
import { Bell } from 'lucide-react';

export default function AddNotification() {
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationDescription, setNotificationDescription] = useState('');

    const handleSubmit = () => {
        // Here you would handle the new notification data
        console.log('New notification:', { title: notificationTitle, description: notificationDescription });
        
        // Reset form and close modal
        setNotificationTitle('');
        setNotificationDescription('');
        setShowNotificationModal(false);
    };

    return (
        <>
        <button 
            className="pending-accounts-btn"
            onClick={() => setShowNotificationModal(true)}
        >
            <div className="btn-content">
            <div className="btn-icon">
                <Bell size={24} />
            </div>
            <div className="btn-text">
                <span className="btn-title">Add New Notification</span>
                <span className="btn-count">Create system-wide alerts</span>
            </div>
            </div>
        </button>

        {showNotificationModal && (
            <div className="notification-modal-overlay">
            <div className="notification-modal-content">
                <div className="notification-modal-header">
                <h2>Add New Notification</h2>
                <button 
                    className="close-btn" 
                    onClick={() => setShowNotificationModal(false)}
                >
                    &times;
                </button>
                </div>
                <div className="notification-modal-body">
                <div className="notification-form-container">
                    <div className="notification-form-group">
                    <label 
                        className="notification-label" 
                        htmlFor="notification-title"
                    >
                        Notification Title
                    </label>
                    <input
                        id="notification-title"
                        type="text"
                        className="notification-input"
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                        placeholder="Enter notification title"
                    />
                    </div>
                    <div className="notification-form-group">
                    <label 
                        className="notification-label" 
                        htmlFor="notification-description"
                    >
                        Notification Description
                    </label>
                    <textarea
                        id="notification-description"
                        className="notification-textarea"
                        value={notificationDescription}
                        onChange={(e) => setNotificationDescription(e.target.value)}
                        placeholder="Enter notification details"
                    />
                    </div>
                    <div className="notification-button-container">
                    <button
                        type="button"
                        className="notification-cancel-button"
                        onClick={() => setShowNotificationModal(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="notification-create-button"
                        onClick={handleSubmit}
                    >
                        Create Notification
                    </button>
                    </div>
                </div>
                </div>
            </div>
            </div>
        )}
        </>
    );
}