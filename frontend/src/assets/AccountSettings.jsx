import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { RiLockPasswordLine } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";
import { MdVerified, MdErrorOutline } from "react-icons/md";
import { BiZoomIn, BiZoomOut } from "react-icons/bi";
import { FaCamera } from "react-icons/fa";
import { getProfile, updateProfile, updatePassword } from "../services/api";
import "../css/AccountSettings.css";

const AccountSettings = ({ isOpen, onClose, user }) => {
    // State for profile data
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        profilePicture: null
    });
    const [originalProfileData, setOriginalProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        profilePicture: null
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationId, setNotificationId] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // States for image handling
    const [originalImage, setOriginalImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [croppedImage, setCroppedImage] = useState(null);
    
    // Image position and zoom state
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const minZoom = 0.5; // Minimum zoom value
    const maxZoom = 3; // Maximum zoom value
    
    // Verification states
    const [emailVerificationCode, setEmailVerificationCode] = useState(null);
    const [emailToVerify, setEmailToVerify] = useState("");
    const [emailVerificationInput, setEmailVerificationInput] = useState("");
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [showEmailVerificationInput, setShowEmailVerificationInput] = useState(false);

    const [phoneVerificationCode, setPhoneVerificationCode] = useState(null);
    const [phoneToVerify, setPhoneToVerify] = useState("");
    const [phoneVerificationInput, setPhoneVerificationInput] = useState("");
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [showPhoneVerificationInput, setShowPhoneVerificationInput] = useState(false);
    
    // Refs
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const cropperContainerRef = useRef(null);
    
    // Unified fetch and populate logic for all user data
    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        getProfile()
            .then((profile) => {
                // Parse fullName into firstName and lastName (if possible)
                let firstName = '';
                let lastName = '';
                if (profile.fullName) {
                    const nameParts = profile.fullName.trim().split(' ');
                    firstName = nameParts[0] || '';
                    lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                }
                setProfileData({
                    firstName,
                    lastName,
                    email: profile.emailAddress || '',
                    phone: profile.contactNumber || '',
                    profilePicture: profile.profilePicture || null
                });
                setOriginalProfileData({
                    firstName,
                    lastName,
                    email: profile.emailAddress || '',
                    phone: profile.contactNumber || '',
                    profilePicture: profile.profilePicture || null
                });
                setIsEmailVerified(true);
                setIsPhoneVerified(true);
                setLoading(false);
            })
            .catch((err) => {
                setError('Failed to load profile data.');
                setLoading(false);
            });
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'email') {
            setIsEmailVerified(value === originalProfileData.email);
        }
        if (name === 'phone') {
            setIsPhoneVerified(value === originalProfileData.phone);
        }
        setProfileData({
            ...profileData,
            [name]: value
        });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({
            ...passwordData,
            [name]: value
        });
        
        // Clear specific error when user starts typing
        if (passwordErrors[name]) {
            setPasswordErrors({
                ...passwordErrors,
                [name]: ''
            });
        }
    };

    const validatePasswordData = () => {
        const errors = {};
        
        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }
        
        if (!passwordData.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        } else if (passwordData.newPassword === passwordData.currentPassword) {
            errors.newPassword = 'New password must be different from current password';
        }
        
        if (!passwordData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your new password';
        } else if (passwordData.confirmPassword !== passwordData.newPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };


    const handlePasswordUpdate = async () => {
        if (!validatePasswordData()) {
            return;
        }
        
        setLoading(true);
        try {
            await updatePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            // Reset password fields
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            
            // Close password section
            setShowPasswordSection(false);
            
            // Show success notification
            showNotification('Password updated successfully', 'success');
            setLoading(false);
        } catch (err) {
            setLoading(false);
            
            // Handle specific errors
            if (err.response && err.response.status === 401) {
                setPasswordErrors({
                    ...passwordErrors,
                    currentPassword: 'Current password is incorrect'
                });
            } else {
                showNotification('Failed to update password: ' + err.message, 'error');
            }
        }
    };
    
    const showNotification = (message, type = 'info') => {
        const id = notificationId + 1;
        setNotificationId(id);
        
        const newNotification = {
            id,
            message,
            type,
            timestamp: new Date()
        };
        
        setNotifications([...notifications, newNotification]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(notifications => 
                notifications.filter(notification => notification.id !== id)
            );
        }, 5000);
    };
    
    const removeNotification = (id) => {
        setNotifications(notifications => 
            notifications.filter(notification => notification.id !== id)
        );
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setOriginalImage(e.target.result);
                setShowCropper(true);
                // Reset image position and zoom when new image is selected
                setImagePosition({ x: 0, y: 0 });
                setZoomLevel(1);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleImageLoad = (e) => {
        // Store the natural image dimensions
        const img = e.target;
        setImageSize({
            width: img.naturalWidth,
            height: img.naturalHeight
        });
        
        // Center the image initially
        if (cropperContainerRef.current) {
            // Calculate initial position to center the image
            setImagePosition({
                x: (cropperContainerRef.current.clientWidth - img.naturalWidth) / 2,
                y: (cropperContainerRef.current.clientHeight - img.naturalHeight) / 2
            });
        }
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - imagePosition.x,
            y: e.clientY - imagePosition.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Apply position constraints
        const { constrainedX, constrainedY } = constrainPosition(newX, newY);
        
        setImagePosition({
            x: constrainedX,
            y: constrainedY
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({
            x: touch.clientX - imagePosition.x,
            y: touch.clientY - imagePosition.y
        });
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        
        const newX = touch.clientX - dragStart.x;
        const newY = touch.clientY - dragStart.y;
        
        // Apply position constraints
        const { constrainedX, constrainedY } = constrainPosition(newX, newY);
        
        setImagePosition({
            x: constrainedX,
            y: constrainedY
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Function to constrain the image position to keep content visible in the crop circle
    const constrainPosition = (x, y) => {
        if (!cropperContainerRef.current || !imageSize.width || !imageSize.height) {
            return { constrainedX: x, constrainedY: y };
        }
        
        const container = cropperContainerRef.current;
        
        // Calculate the circle dimensions
        const circleRadius = Math.min(container.clientWidth, container.clientHeight) * 0.4;
        const circleCenterX = container.clientWidth / 2;
        const circleCenterY = container.clientHeight / 2;
        
        // Calculate zoomed image dimensions
        const zoomedWidth = imageSize.width * zoomLevel;
        const zoomedHeight = imageSize.height * zoomLevel;
        
        // Calculate the minimum X position (right edge of image at left edge of circle)
        const minX = circleCenterX + circleRadius - zoomedWidth;
        // Calculate the maximum X position (left edge of image at right edge of circle)
        const maxX = circleCenterX - circleRadius;
        
        // Calculate the minimum Y position (bottom edge of image at top edge of circle)
        const minY = circleCenterY + circleRadius - zoomedHeight;
        // Calculate the maximum Y position (top edge of image at bottom edge of circle)
        const maxY = circleCenterY - circleRadius;
        
        // For very small or zoomed out images, center them instead of allowing empty space
        const constrainedX = zoomedWidth < circleRadius * 2 
            ? (container.clientWidth - zoomedWidth) / 2
            : Math.min(maxX, Math.max(minX, x));
        
        const constrainedY = zoomedHeight < circleRadius * 2
            ? (container.clientHeight - zoomedHeight) / 2
            : Math.min(maxY, Math.max(minY, y));
        
        return { constrainedX, constrainedY };
    };

    // Handle zoom change using the slider
    const handleZoomChange = (e) => {
        const prevZoom = zoomLevel;
        const newZoom = parseFloat(e.target.value);
        setZoomLevel(newZoom);
        
        // Adjust position to maintain centering when zooming
        if (cropperContainerRef.current) {
            // Calculate how much the image dimensions will change
            const widthDiff = imageSize.width * (newZoom - prevZoom);
            const heightDiff = imageSize.height * (newZoom - prevZoom);
        
            // Adjust position to keep center point unchanged
            const newX = imagePosition.x - (widthDiff / 2);
            const newY = imagePosition.y - (heightDiff / 2);
        
            // Apply constraints
            const { constrainedX, constrainedY } = constrainPosition(newX, newY);
            setImagePosition({ x: constrainedX, y: constrainedY });
        }
    };

    // Handle wheel zoom
    const handleWheel = (e) => {
        e.preventDefault();
        
        // Determine zoom direction based on wheel delta
        const delta = -Math.sign(e.deltaY);
        const zoomChange = delta * 0.05; // Adjust zoom sensitivity
        
        const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel + zoomChange));
        
        // Skip if no actual change in zoom level
        if (newZoom === zoomLevel) return;
        
        setZoomLevel(newZoom);
        
        // Calculate the position under cursor
        const rect = cropperContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate the distance from cursor to image origin
        const distX = mouseX - imagePosition.x;
        const distY = mouseY - imagePosition.y;
        
        // Calculate the new distance after zoom
        const newDistX = distX * (newZoom / zoomLevel);
        const newDistY = distY * (newZoom / zoomLevel);
        
        // Calculate the new position
        const newX = mouseX - newDistX;
        const newY = mouseY - newDistY;
        
        // Apply constraints
        const { constrainedX, constrainedY } = constrainPosition(newX, newY);
        setImagePosition({ x: constrainedX, y: constrainedY });
    };

    const generateCroppedImage = () => {
        if (!cropperContainerRef.current || !originalImage) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to desired output size
        canvas.width = 200;
        canvas.height = 200;
        
        // Create a new image object
        const img = new Image();
        img.src = originalImage;
        
        img.onload = () => {
            // Calculate the circle center and radius
            const circleRadius = Math.min(cropperContainerRef.current.clientWidth, cropperContainerRef.current.clientHeight) * 0.4;
            const circleCenterX = cropperContainerRef.current.clientWidth / 2;
            const circleCenterY = cropperContainerRef.current.clientHeight / 2;
        
            // Calculate the portion of the image to crop
            // Account for zoom level in the calculations
            const sourceX = (circleCenterX - circleRadius - imagePosition.x) / zoomLevel;
            const sourceY = (circleCenterY - circleRadius - imagePosition.y) / zoomLevel;
            const sourceWidth = (circleRadius * 2) / zoomLevel;
            const sourceHeight = (circleRadius * 2) / zoomLevel;
        
            // Draw the cropped portion
            ctx.drawImage(
                img,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, canvas.width, canvas.height
            );
        
            // Create circular clip
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        
            // Reset composite operation
            ctx.globalCompositeOperation = 'source-over';
        
            // Get the cropped image data
            const croppedDataURL = canvas.toDataURL('image/png');
            setCroppedImage(croppedDataURL);
        
            // Update profile data with the cropped image
            setProfileData({
                ...profileData,
                profilePicture: croppedDataURL
            });
        
            // Close the cropper
            setShowCropper(false);
            setOriginalImage(null);
        };
    };

    const handleCropConfirm = () => {
        generateCroppedImage();
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setOriginalImage(null);
    };

    const handleVerifyEmail = async () => {
        try {
            // Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setEmailVerificationCode(code);
            setEmailToVerify(profileData.email);
            setShowEmailVerificationInput(true);
            setIsEmailVerified(false);
            
            // Call your backend API to send the OTP via email
            await axios.post('/api/send-email-otp', {
                email: profileData.email,
                code: code
            });
            
            // Success notification
            setSuccess("Verification code sent to your email.");
        } catch (error) {
            setError("Failed to send verification code. Please try again.");
            console.error("Email OTP sending error:", error);
        }
    };

    const handleEmailVerificationSubmit = () => {
        if (
            emailVerificationInput === emailVerificationCode &&
            profileData.email === emailToVerify
        ) {
            setIsEmailVerified(true);
            setShowEmailVerificationInput(false);
            showNotification("Email verified successfully!", "success");
        } else {
            showNotification("Verification failed. Please check the code and email.", "error");
        }
    };

    const handleVerifyPhone = async () => {
        try {
            // Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setPhoneVerificationCode(code);
            setPhoneToVerify(profileData.phone);
            setShowPhoneVerificationInput(true);
            setIsPhoneVerified(false);
            
            // Call the Twilio API to send the OTP via SMS
            // This would typically be done through your backend to protect API keys
            await axios.post('/api/send-otp', {
                phone: profileData.phone,
                code: code
            });
            
            // Success notification
            setSuccess("Verification code sent to your phone.");
        } catch (error) {
            setError("Failed to send verification code. Please try again.");
            console.error("OTP sending error:", error);
        }
    };

    const handlePhoneVerificationSubmit = () => {
        if (
            phoneVerificationInput === phoneVerificationCode &&
            profileData.phone === phoneToVerify
        ) {
            setIsPhoneVerified(true);
            setShowPhoneVerificationInput(false);
            showNotification("Phone number verified successfully!", "success");
        } else {
            showNotification("Verification failed. Please check the code and phone number.", "error");
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            // Only include changed fields and use backend-expected keys
            const updatePayload = {};
            if (
                profileData.email &&
                profileData.email !== originalProfileData.email
            ) {
                updatePayload.emailAddress = profileData.email;
            }
            if (
                profileData.phone &&
                profileData.phone !== originalProfileData.phone
            ) {
                updatePayload.contactNumber = profileData.phone;
            }
            if (
                croppedImage &&
                croppedImage !== originalProfileData.profilePicture
            ) {
                updatePayload.profilePicture = croppedImage;
            } else if (
                !croppedImage &&
                profileData.profilePicture &&
                profileData.profilePicture !== originalProfileData.profilePicture
            ) {
                updatePayload.profilePicture = profileData.profilePicture;
            }
            // Remove undefined/empty fields
            Object.keys(updatePayload).forEach(
                (key) =>
                    (updatePayload[key] === undefined || updatePayload[key] === "") &&
                    delete updatePayload[key]
            );
            if (Object.keys(updatePayload).length === 0) {
                setError("No changes to save.");
                setLoading(false);
                return;
            }
            await updateProfile(updatePayload);
            setSuccess("Profile updated successfully.");
            setOriginalProfileData({
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                email: profileData.email,
                phone: profileData.phone,
                profilePicture: croppedImage || profileData.profilePicture
            });
            setLoading(false);
        } catch (err) {
            setError("Failed to update profile: " + err.message);
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        if(window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            // Call delete account API here
            showNotification("Account deletion requested. You will receive a confirmation email.", "info");
        }
    };

    // Helper functions for verification status
    const isCurrentEmailVerified = profileData.email === originalProfileData.email && isEmailVerified;
    const isCurrentPhoneVerified = profileData.phone === originalProfileData.phone && isPhoneVerified;

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="notification-container">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`notification notification-${notification.type}`}
                    >
                        <div className="notification-content">
                            {notification.message}
                        </div>
                        <button 
                            className="notification-close"
                            onClick={() => removeNotification(notification.id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
            <div className="account-settings-modal">
                <div className="modal-header">
                    <h2>Account Settings</h2>
                    <button className="close-button" onClick={onClose}>
                        <IoMdClose />
                    </button>
                </div>
                <div className="account-settings-content">
                    {loading ? (
                        <div className="loading">Loading...</div>
                    ) : error ? (
                        <div className="error">{error}</div>
                    ) : (
                    <>
                        {success && <div className="success">{success}</div>}
                        {showCropper ? (
                            <div className="image-cropper-container">
                                <h3>Adjust Your Profile Picture</h3>
                                
                                <div 
                                className="crop-area-container"
                                ref={cropperContainerRef}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onWheel={handleWheel}
                                >
                                <div className="crop-circle-overlay"></div>
                                {originalImage && (
                                    <img 
                                    src={originalImage}
                                    alt="Adjust profile"
                                    className="draggable-image"
                                    style={{ 
                                        transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoomLevel})`,
                                        transformOrigin: '0 0'
                                    }}
                                    onLoad={handleImageLoad}
                                    onMouseDown={handleMouseDown}
                                    onTouchStart={handleTouchStart}
                                    draggable="false"
                                    />
                                )}
                                
                                {/* Canvas for cropping - hidden */}
                                <canvas 
                                    ref={canvasRef}
                                    style={{ display: 'none' }}
                                />
                                </div>
                                
                                {/* Zoom controls with range slider instead of buttons */}
                                <div className="zoom-controls">
                                <BiZoomOut className="zoom-icon" />
                                <input
                                    type="range"
                                    className="zoom-slider"
                                    min={minZoom}
                                    max={maxZoom}
                                    step="0.1"
                                    value={zoomLevel}
                                    onChange={handleZoomChange}
                                />
                                <BiZoomIn className="zoom-icon" />
                                <div className="zoom-level">{Math.round(zoomLevel * 100)}%</div>
                                </div>
                                
                                <p className="crop-info">
                                    Drag to position your image and use the slider or mouse wheel to zoom. The area inside the circle will become your profile picture.
                                </p>
                                
                                <div className="crop-buttons">
                                <button className="cancel-button" onClick={handleCropCancel}>Cancel</button>
                                <button className="confirm-button" onClick={handleCropConfirm}>Crop & Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="accts-modal-content">
                                <div className="profile-image-section">
                                <div className="profile-image-container">
                                    {profileData.profilePicture ? (
                                    <img src={profileData.profilePicture} alt="Profile" className="profile-image" />
                                    ) : (
                                    <div className="profile-placeholder">
                                        {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                                    </div>
                                    )}
                                    <button className="change-image-button" onClick={() => fileInputRef.current.click()}>
                                    <FaCamera />
                                    </button>
                                    <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*" 
                                    style={{ display: 'none' }}
                                    />
                                </div>
                                </div>

                                <div className="form-group">
                                <label>Full Name</label>
                                <div className="name-fields">
                                    <input 
                                    type="text" 
                                    name="firstName"
                                    value={profileData.firstName}
                                    readOnly
                                    className="read-only-field"
                                    />
                                    <input 
                                    type="text" 
                                    name="lastName"
                                    value={profileData.lastName}
                                    readOnly
                                    className="read-only-field"
                                    />
                                </div>
                                </div>

                                <div className="form-group">
                                <label>Email</label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input 
                                    type="email" 
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    />
                                    {isCurrentEmailVerified ? (
                                    <span style={{ color: 'green', display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                                        <MdVerified style={{ marginRight: 2 }} /> Verified
                                    </span>
                                    ) : (
                                    <span style={{ color: 'orange', display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                                        <MdErrorOutline style={{ marginRight: 2 }} /> Unverified
                                        <button className="verify-button" style={{ marginLeft: 8 }} onClick={handleVerifyEmail} disabled={showEmailVerificationInput}>Verify</button>
                                    </span>
                                    )}
                                </div>
                                {showEmailVerificationInput && !isCurrentEmailVerified && (
                                    <div className="verification-input-group">
                                        <input
                                            type="text"
                                            placeholder="Enter verification code"
                                            value={emailVerificationInput}
                                            onChange={e => setEmailVerificationInput(e.target.value)}
                                        />
                                        <button onClick={handleEmailVerificationSubmit}>Submit</button>
                                    </div>
                                )}
                                </div>

                                <div className="form-group">
                                <label>Phone</label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input 
                                    type="text" 
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    />
                                    {isCurrentPhoneVerified ? (
                                    <span style={{ color: 'green', display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                                        <MdVerified style={{ marginRight: 2 }} /> Verified
                                    </span>
                                    ) : (
                                    <span style={{ color: 'orange', display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                                        <MdErrorOutline style={{ marginRight: 2 }} /> Unverified
                                        <button className="verify-button" style={{ marginLeft: 8 }} onClick={handleVerifyPhone} disabled={showPhoneVerificationInput}>Verify</button>
                                    </span>
                                    )}
                                </div>
                                {showPhoneVerificationInput && !isCurrentPhoneVerified && (
                                    <div className="verification-input-group">
                                        <input
                                            type="text"
                                            placeholder="Enter verification code"
                                            value={phoneVerificationInput}
                                            onChange={e => setPhoneVerificationInput(e.target.value)}
                                        />
                                        <button onClick={handlePhoneVerificationSubmit}>Submit</button>
                                    </div>
                                )}
                                </div>

                                <div className="form-group password-section">
                                    <div className="password-section-header" onClick={() => setShowPasswordSection(!showPasswordSection)}>
                                        <div className="password-section-title">
                                            <RiLockPasswordLine />
                                            <span>Change Password</span>
                                        </div>
                                        <div className="password-toggle">
                                            {showPasswordSection ? '−' : '+'}
                                        </div>
                                    </div>
                                    
                                    {showPasswordSection && (
                                        <div className="password-form">
                                            <div className="form-group">
                                                <label>Current Password</label>
                                                <input 
                                                    type="password"
                                                    name="currentPassword"
                                                    value={passwordData.currentPassword}
                                                    onChange={handlePasswordChange}
                                                    disabled={loading}
                                                />
                                                {passwordErrors.currentPassword && (
                                                    <div className="input-error">{passwordErrors.currentPassword}</div>
                                                )}
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>New Password</label>
                                                <input 
                                                    type="password"
                                                    name="newPassword"
                                                    value={passwordData.newPassword}
                                                    onChange={handlePasswordChange}
                                                    disabled={loading}
                                                />
                                                {passwordErrors.newPassword && (
                                                    <div className="input-error">{passwordErrors.newPassword}</div>
                                                )}
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>Confirm New Password</label>
                                                <input 
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={passwordData.confirmPassword}
                                                    onChange={handlePasswordChange}
                                                    disabled={loading}
                                                />
                                                {passwordErrors.confirmPassword && (
                                                    <div className="input-error">{passwordErrors.confirmPassword}</div>
                                                )}
                                            </div>
                                            
                                            <button 
                                                className="update-password-button"
                                                onClick={handlePasswordUpdate}
                                                disabled={loading}
                                            >
                                                Update Password
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="accts-form-actions">
                                    <button className="delete-account-button" onClick={handleDeleteAccount}>Delete My Account</button>
                                    <div className="form-right-buttons">
                                        <button className="cancel-button" onClick={onClose}>Cancel</button>
                                        <button className="save-button" onClick={handleSave}>Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;