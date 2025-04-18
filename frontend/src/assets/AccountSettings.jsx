import React, { useState, useRef, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { MdVerified, MdErrorOutline } from "react-icons/md";
import { BiZoomIn, BiZoomOut } from "react-icons/bi";
import { FaCamera } from "react-icons/fa";
import "../css/AccountSettings.css";

const AccountSettings = ({ isOpen, onClose, currentUser, updateUserData }) => {
  // State for profile data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePicture: null
  });
  
  // States for image handling
  const [originalImage, setOriginalImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState(null);
  const [isEmailChanged, setIsEmailChanged] = useState(false);
  const [isPhoneChanged, setIsPhoneChanged] = useState(false);
  
  // Image position and zoom state
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const minZoom = 0.5; // Minimum zoom value
  const maxZoom = 3; // Maximum zoom value
  
  // Refs
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const cropperContainerRef = useRef(null);
  
  // Initialize user data
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        profilePicture: currentUser.profilePicture || null
      });
      setCroppedImage(currentUser.profilePicture || null);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email' && value !== currentUser.email) {
      setIsEmailChanged(true);
    } else if (name === 'email' && value === currentUser.email) {
      setIsEmailChanged(false);
    }
    
    if (name === 'phone' && value !== currentUser.phone) {
      setIsPhoneChanged(true);
    } else if (name === 'phone' && value === currentUser.phone) {
      setIsPhoneChanged(false);
    }
    
    setProfileData({
      ...profileData,
      [name]: value
    });
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
      const containerWidth = cropperContainerRef.current.clientWidth;
      const containerHeight = cropperContainerRef.current.clientHeight;
      
      // Calculate initial position to center the image
      setImagePosition({
        x: (containerWidth - img.naturalWidth) / 2,
        y: (containerHeight - img.naturalHeight) / 2
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
    const containerRect = container.getBoundingClientRect();
    
    // Calculate the circle dimensions
    const circleRadius = Math.min(containerRect.width, containerRect.height) * 0.4;
    const circleCenterX = containerRect.width / 2;
    const circleCenterY = containerRect.height / 2;
    
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
      ? (containerRect.width - zoomedWidth) / 2
      : Math.min(maxX, Math.max(minX, x));
      
    const constrainedY = zoomedHeight < circleRadius * 2
      ? (containerRect.height - zoomedHeight) / 2
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
      const containerRect = cropperContainerRef.current.getBoundingClientRect();
      
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
      // Get the cropper container dimensions
      const container = cropperContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Calculate the circle center and radius
      const circleRadius = Math.min(containerRect.width, containerRect.height) * 0.4;
      const circleCenterX = containerRect.width / 2;
      const circleCenterY = containerRect.height / 2;
      
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

  const handleVerifyEmail = () => {
    alert(`Verification email sent to ${profileData.email}`);
  };

  const handleVerifyPhone = () => {
    alert(`Verification code sent to ${profileData.phone}`);
  };

  const handleSave = () => {
    updateUserData({
      ...currentUser,
      ...profileData,
      emailVerified: isEmailChanged ? false : currentUser.emailVerified,
      phoneVerified: isPhoneChanged ? false : currentUser.phoneVerified
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="account-settings-modal">
        <div className="modal-header">
          <h2>Account Settings</h2>
          <button className="close-button" onClick={onClose}>
            <IoMdClose />
          </button>
        </div>

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
              <label>Name (Not Editable)</label>
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
              <label>Email Address</label>
              <div className="verification-field">
                <input 
                  type="email" 
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                />
                {isEmailChanged ? (
                  <div className="verification-status unverified">
                    <MdErrorOutline className="verification-icon" />
                    <span>Unverified</span>
                    <button className="verify-button" onClick={handleVerifyEmail}>Verify</button>
                  </div>
                ) : (
                  <div className="verification-status verified">
                    <MdVerified className="verification-icon" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <div className="verification-field">
                <input 
                  type="tel" 
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                />
                {isPhoneChanged ? (
                  <div className="verification-status unverified">
                    <MdErrorOutline className="verification-icon" />
                    <span>Unverified</span>
                    <button className="verify-button" onClick={handleVerifyPhone}>Verify</button>
                  </div>
                ) : (
                  <div className="verification-status verified">
                    <MdVerified className="verification-icon" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button className="cancel-button" onClick={onClose}>Cancel</button>
              <button className="save-button" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;