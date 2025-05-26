import React from "react";
import { IoMdClose } from "react-icons/io";
import { MdDeleteOutline } from "react-icons/md";
import "../css/Notifications.css";

const Notifications = ({ notification, onClose, onDelete }) => {
    // Generate content based on notification data
    const getExtendedContent = () => {
        // If notification has custom content, use it
        if (notification.content) {
            return notification.content;
        }

        // Otherwise, generate content based on notification type and data
        const content = [];
        
        if (notification.data) {
            // Add any relevant data points
            Object.entries(notification.data).forEach(([key, value]) => {
                if (typeof value === 'string' || typeof value === 'number') {
                    content.push(
                        <li key={key}>
                            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                        </li>
                    );
                }
            });
        }

        // Add the main message
        if (notification.message) {
            content.unshift(
                <p key="message">{notification.message}</p>
            );
        }

        // Add any additional context
        if (notification.context) {
            content.push(
                <div key="context" className="message-content">
                    {notification.context}
                </div>
            );
        }

        return content.length > 0 ? content : <p>No additional details available.</p>;
    };

    return (
        <div className="modal-overlay">
            <div className="notification-detail-modal">
                <div className="modal-header">
                    <h2>{notification.title}</h2>
                    <div className="header-actions">
                        <button 
                            className="delete-button" 
                            title="Delete notification"
                            onClick={() => onDelete(notification.id)}
                        >
                            <MdDeleteOutline />
                        </button>
                        <button className="close-button" onClick={onClose}>
                            <IoMdClose />
                        </button>
                    </div>
                </div>
                <div className="notification-date-display">
                    {notification.date}
                </div>
                <div className="notification-detail-content">
                    {getExtendedContent()}
                </div>
            </div>
        </div>
    );
};

export default Notifications;