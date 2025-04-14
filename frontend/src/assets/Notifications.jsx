import React from "react";
import { IoMdClose } from "react-icons/io";
import { MdDeleteOutline } from "react-icons/md";
import "../css/Notifications.css";

const Notifications = ({ notification, onClose, onDelete }) => {
  // Generate extended content for the notification detail
  const getExtendedContent = () => {
    switch (notification.title) {
      case "New Hog Owner":
        return (
          <>
            <p>A new hog owner has been added to the system:</p>
            <ul>
              <li><strong>Name:</strong> John Smith</li>
              <li><strong>Email:</strong> john.smith@example.com</li>
              <li><strong>Phone:</strong> (555) 123-4567</li>
              <li><strong>Registration Date:</strong> April 12, 2025</li>
              <li><strong>Number of Hogs:</strong> 3</li>
            </ul>
            <p>Please review the account details and reach out to the owner for a welcome call.</p>
          </>
        );
      case "Payment Received":
        return (
          <>
            <p>A payment has been processed and added to your account:</p>
            <ul>
              <li><strong>Amount:</strong> $250.00</li>
              <li><strong>From:</strong> Emma Johnson</li>
              <li><strong>Payment Method:</strong> Credit Card (ending in 4567)</li>
              <li><strong>Transaction ID:</strong> TXN-2025-04112-89FG</li>
              <li><strong>Services:</strong> Monthly Hog Care Package</li>
            </ul>
            <p>The receipt has been emailed to both you and the customer.</p>
          </>
        );
      case "System Update":
        return (
          <>
            <p>Important notice regarding scheduled system maintenance:</p>
            <p>The dashboard will be undergoing routine maintenance on April 15th, 2025 from 2:00 AM to 4:00 AM local time. During this period, the system will be unavailable.</p>
            <p>Updates to be implemented include:</p>
            <ul>
              <li>Security patches</li>
              <li>Performance improvements</li>
              <li>New reporting features</li>
              <li>UI enhancements</li>
            </ul>
            <p>Please ensure all important work is saved before the maintenance window begins.</p>
          </>
        );
      case "New Message":
        return (
          <>
            <p>You have received a new message from Dr. Martinez regarding vaccination schedules:</p>
            <div className="message-content">
              <p>Hello,</p>
              <p>I wanted to inform you about the updated vaccination schedule for hogs that will take effect next month. We'll be introducing a new vaccine for respiratory ailments that has shown promising results in our trials.</p>
              <p>Could you please schedule a meeting next week to discuss the implementation details? I'm available on Tuesday and Thursday afternoons.</p>
              <p>Best regards,<br/>Dr. Elena Martinez<br/>Chief Veterinarian</p>
            </div>
            <p>Please respond to this message at your earliest convenience.</p>
          </>
        );
      case "Appointment Request":
        return (
          <>
            <p>Lisa Wilson has requested an appointment for a hog health check:</p>
            <ul>
              <li><strong>Requested Date:</strong> April 18th, 2025</li>
              <li><strong>Preferred Time:</strong> 10:00 AM - 12:00 PM</li>
              <li><strong>Number of Hogs:</strong> 2</li>
              <li><strong>Reason:</strong> Annual health examination and vaccination update</li>
              <li><strong>Special Requests:</strong> One hog is elderly (12 years) and may require special handling</li>
            </ul>
            <div className="action-buttons">
              <button className="approve-button">Approve</button>
              <button className="reschedule-button">Suggest New Time</button>
              <button className="reject-button">Decline</button>
            </div>
          </>
        );
      default:
        return <p>{notification.message}</p>;
    }
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