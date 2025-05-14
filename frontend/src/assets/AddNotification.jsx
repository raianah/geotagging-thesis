import { useState } from 'react';
import { Bell, Info, AlertTriangle, Syringe, WrenchIcon } from 'lucide-react';
import { notificationService } from '../services/notificationService';

export default function AddNotification() {
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationDescription, setNotificationDescription] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    
    // Dynamic template generation based on system events
    const generateTemplate = (templateName) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        const dateTimeStr = `[${dateStr} ${timeStr}]`;
        
        switch(templateName) {
            case 'info':
                return {
                    title: 'System Update',
                    description: `${dateTimeStr} System update notification. Please check the details.`
                };
            case 'asf_alert':
                return {
                    title: 'ASF Alert',
                    description: `${dateTimeStr} Critical ASF alert. Please check the dashboard for immediate action required.`
                };
            case 'vaccination_drive':
                return {
                    title: 'Vaccination Update',
                    description: `${dateTimeStr} New vaccination schedule update. Please review the details.`
                };
            case 'maintenance':
                return {
                    title: 'System Maintenance',
                    description: `${dateTimeStr} Scheduled maintenance notification. Please check the maintenance schedule.`
                };
            default:
                return {
                    title: '',
                    description: ''
                };
        }
    };

    const applyTemplate = (templateName) => {
        if (!templateName || templateName === 'none') {
            setSelectedTemplate('');
            setNotificationTitle('');
            setNotificationDescription('');
            return;
        }
        
        setSelectedTemplate(templateName);
        const template = generateTemplate(templateName);
        setNotificationTitle(template.title);
        setNotificationDescription(template.description);
    };

    const handleSubmit = async () => {
        try {
            const notificationData = {
                title: notificationTitle,
                message: notificationDescription,
                type: selectedTemplate || 'info',
                userId: null // Always null for global notifications
            };
            await notificationService.createNotification(notificationData);
            console.log('New notification created:', notificationData);
            setSelectedTemplate('');
            setNotificationTitle('');
            setNotificationDescription('');
            setShowNotificationModal(false);
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    };

    // Get template icon based on template name
    const getTemplateIcon = (templateName) => {
        switch(templateName) {
            case 'info': return <Info size={16} className="mr-2" />;
            case 'asf_alert': return <AlertTriangle size={16} className="mr-2" />;
            case 'vaccination_drive': return <Syringe size={16} className="mr-2" />;
            case 'maintenance': return <WrenchIcon size={16} className="mr-2" />;
            default: return null;
        }
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
                    className="em-close-btn" 
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
                            htmlFor="notification-template"
                        >
                            Select Template
                        </label>
                        <div className="template-selector">
                            <select
                                id="notification-template"
                                className="notification-select"
                                value={selectedTemplate}
                                onChange={(e) => applyTemplate(e.target.value)}
                            >
                                <option value="none">-- Select a template --</option>
                                <option value="info">Information Update</option>
                                <option value="asf_alert">ASF Alert</option>
                                <option value="vaccination_drive">Vaccination Drive</option>
                                <option value="maintenance">System Maintenance</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="notification-form-group">
                    <label 
                        className="notification-label" 
                        htmlFor="notification-title"
                    >
                        Notification Title
                    </label>
                    <div className="notification-input-wrapper">
                        {selectedTemplate && getTemplateIcon(selectedTemplate)}
                        <input
                            id="notification-title"
                            type="text"
                            className="notification-title-input"
                            value={notificationTitle}
                            onChange={(e) => setNotificationTitle(e.target.value)}
                            placeholder="Enter notification title"
                        />
                    </div>
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