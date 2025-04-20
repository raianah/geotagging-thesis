import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/RegistrationCSS.css";
import logo from '../img/logo.png';

export default function RegistrationForm() {
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		location: "",
		locationImage: null,
		totalHogs: "1",
		validId: null,
		hogPhotos: [],
		acceptedPrivacyPolicy: false
	});
	
	const [errors, setErrors] = useState({});
	const [locationLoading, setLocationLoading] = useState(false);
	const [locationError, setLocationError] = useState("");
	const [hogInputType, setHogInputType] = useState("input"); // "input" or "dropdown"
	const [showCamera, setShowCamera] = useState(false);
	const [cameraReady, setCameraReady] = useState(false);
	
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const mediaStreamRef = useRef(null);
	
	const navigate = useNavigate();

	const handleCheckboxChange = (e) => {
		const { name, checked } = e.target;
		setFormData({ ...formData, [name]: checked });
		
		// Clear error when user checks the box
		if (errors[name]) {
			setErrors({...errors, [name]: ""});
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
		
		// Clear error when user starts typing
		if (errors[name]) {
			setErrors({...errors, [name]: ""});
		}
	};

	const handlePhoneChange = (e) => {
		const value = e.target.value;
		// Only allow numbers and ensure it starts with +639
		if (!value.startsWith('+639')) {
			setFormData({ ...formData, phone: '+639' });
			return;
		}
		
		// Remove any non-numeric characters except the leading '+'
		const sanitizedValue = '+639' + value.substring(4).replace(/[^0-9]/g, '');
		
		// Restrict length to 13 characters (+639 + 9 digits)
		if (sanitizedValue.length <= 13) {
			setFormData({ ...formData, phone: sanitizedValue });
		}
	};
	
	const handleTotalHogsChange = (e) => {
		const value = e.target.value;
		// Only allow positive numbers up to 999
		if (value === "" || (/^\d+$/.test(value) && parseInt(value) > 0 && parseInt(value) <= 999)) {
			setFormData({ ...formData, totalHogs: value });
		}
	};

	const validateEmail = (email) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(email);
	};

	const handleGetLocation = () => {
		setLocationLoading(true);
		setLocationError("");
		
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					
					// Use reverse geocoding to get address (simplified for example)
					// In production, you would use a service like Google Maps API
					fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
						.then(response => response.json())
						.then(data => {
							const location = data.display_name || `Lat: ${latitude}, Long: ${longitude}`;
							setFormData({ ...formData, location });
							setLocationLoading(false);
						})
						.catch(error => {
							setLocationError("Failed to get address. Using coordinates.");
							setFormData({ ...formData, location: `Lat: ${latitude}, Long: ${longitude}` });
							setLocationLoading(false);
						});
				},
				(error) => {
					setLocationError("Failed to get location. Please try again.");
					setLocationLoading(false);
				}
			);
		} else {
			setLocationError("Geolocation is not supported by this browser.");
			setLocationLoading(false);
		}
	};
	
	// Start the camera for geocam-like functionality
	const startCamera = async () => {
		try {
			console.log("Starting camera...");
			// First, make sure we're showing the camera container
			setShowCamera(true);
			setCameraReady(false);
			setLocationError("");
			
			// Short delay to ensure DOM is updated before accessing video element
			setTimeout(async () => {
				try {
					if (!videoRef.current) {
						console.error("Video element not found in the DOM");
						setLocationError("Camera initialization failed: Video element not available");
						return;
					}
					
					// Try with simpler constraints first
					const constraints = { 
						video: true,
						audio: false
					};
					
					console.log("Requesting media stream with constraints:", constraints);
					const stream = await navigator.mediaDevices.getUserMedia(constraints);
					console.log("Stream obtained:", stream);
					
					if (videoRef.current) {
						console.log("Setting video source");
						videoRef.current.srcObject = stream;
						mediaStreamRef.current = stream;
						
						videoRef.current.onloadedmetadata = () => {
							console.log("Video metadata loaded");
							videoRef.current.play()
								.then(() => {
									console.log("Video playing successfully");
									setCameraReady(true);
								})
								.catch(e => {
									console.error("Error playing video:", e);
									setLocationError("Error playing video: " + e.message);
								});
						};
					} else {
						console.error("Video reference lost after timeout");
						setLocationError("Camera initialization failed: Video element disappeared");
					}
				} catch (err) {
					console.error("Error in delayed camera start:", err);
					setLocationError("Camera access error: " + err.message);
				}
			}, 500);
		} catch (err) {
			console.error("Error accessing camera: ", err);
			setLocationError("Could not access camera: " + err.message);
			setShowCamera(false);
		}
	};
	
	// Stop the camera stream
	const stopCamera = () => {
		console.log("Stopping camera...");
		if (mediaStreamRef.current) {
			mediaStreamRef.current.getTracks().forEach(track => {
				console.log("Stopping track:", track);
				track.stop();
			});
			mediaStreamRef.current = null;
		}
		setShowCamera(false);
		setCameraReady(false);
	};
	
	// Capture photo and location
	const captureLocation = () => {
		if (!navigator.geolocation) {
			setLocationError("Geolocation is not supported by this browser.");
			stopCamera();
			return;
		}
		
		if (!cameraReady) {
			setLocationError("Camera is not ready yet. Please wait.");
			return;
		}
		
		setLocationLoading(true);
		setLocationError("");
		
		// Get current position
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				
				// Capture image from video stream
				const canvas = canvasRef.current;
				const video = videoRef.current;
				
				if (canvas && video) {
					console.log("Capturing image from video");
					console.log("Video dimensions:", video.videoWidth, video.videoHeight);
					
					// Set canvas dimensions to match video
					canvas.width = video.videoWidth || 640;
					canvas.height = video.videoHeight || 480;
					
					try {
						// Draw the video frame to the canvas
						const context = canvas.getContext('2d');
						context.drawImage(video, 0, 0, canvas.width, canvas.height);
						
						// Convert canvas to image data URL
						const imageDataUrl = canvas.toDataURL('image/jpeg');
						console.log("Image captured successfully");
						
						// Use reverse geocoding to get address
						fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
							.then(response => response.json())
							.then(data => {
								const location = data.display_name || `Lat: ${latitude}, Long: ${longitude}`;
								setFormData(prev => ({ 
									...prev, 
									location, 
									locationImage: imageDataUrl 
								}));
								setLocationLoading(false);
								stopCamera();
							})
							.catch(error => {
								setLocationError("Failed to get address. Using coordinates.");
								setFormData(prev => ({ 
									...prev, 
									location: `Lat: ${latitude}, Long: ${longitude}`,
									locationImage: imageDataUrl
								}));
								setLocationLoading(false);
								stopCamera();
							});
					} catch (drawError) {
						console.error("Error drawing to canvas:", drawError);
						setLocationError("Failed to capture image: " + drawError.message);
						setLocationLoading(false);
					}
				} else {
					console.error("Canvas or video element not available");
					setLocationError("Failed to capture: Canvas or video element not available");
					setLocationLoading(false);
				}
			},
			(error) => {
				setLocationError("Failed to get location. Please try again.");
				setLocationLoading(false);
				stopCamera();
			}
		);
	};
	
	// Cancel camera capture
	const cancelCapture = () => {
		stopCamera();
	};

	const handleValidIdUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			// Check file type
			if (!file.type.match('image.*')) {
				setErrors({...errors, validId: "Please upload an image file"});
				return;
			}
			
			// Check file size (limit to 5MB)
			if (file.size > 5 * 1024 * 1024) {
				setErrors({...errors, validId: "File size should be less than 5MB"});
				return;
			}
			
			setFormData({ ...formData, validId: file });
			setErrors({...errors, validId: ""});
		}
	};

	const handleHogPhotosUpload = (e) => {
		const files = Array.from(e.target.files);
		
		// Limit to 3 photos
		if (formData.hogPhotos.length + files.length > 3) {
			setErrors({...errors, hogPhotos: "Maximum 3 photos allowed"});
			return;
		}
		
		// Validate files
		const invalidFiles = files.filter(file => !file.type.match('image.*'));
		if (invalidFiles.length > 0) {
			setErrors({...errors, hogPhotos: "Please upload only image files"});
			return;
		}
		
		// Check file sizes
		const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
		if (oversizedFiles.length > 0) {
			setErrors({...errors, hogPhotos: "File size should be less than 5MB"});
			return;
		}
		
		setFormData({ ...formData, hogPhotos: [...formData.hogPhotos, ...files] });
		setErrors({...errors, hogPhotos: ""});
	};

	const removeHogPhoto = (index) => {
		const updatedPhotos = [...formData.hogPhotos];
		updatedPhotos.splice(index, 1);
		setFormData({ ...formData, hogPhotos: updatedPhotos });
	};
	
	const removeLocationPhoto = () => {
		setFormData({ ...formData, locationImage: null });
	};

	const validateForm = () => {
		const newErrors = {};
		
		if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
		if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
		
		if (!formData.phone || formData.phone.length !== 13) {
			newErrors.phone = "Phone number must be +639 followed by 9 digits";
		}
		
		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!validateEmail(formData.email)) {
			newErrors.email = "Please enter a valid email address";
		}
		
		if (!formData.location) newErrors.location = "Location is required";
		if (!formData.totalHogs) newErrors.totalHogs = "Number of hogs is required";
		if (!formData.validId) newErrors.validId = "Valid ID is required";
		if (formData.hogPhotos.length === 0) newErrors.hogPhotos = "At least one hog photo is required";

		if (!formData.acceptedPrivacyPolicy) {
			newErrors.acceptedPrivacyPolicy = "You must agree to the Privacy Policy";
		}
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleRegister = async (e) => {
		e.preventDefault();
		
		if (!validateForm()) return;
		
		// Create FormData for file uploads
		const formDataObj = new FormData();
		formDataObj.append("firstName", formData.firstName);
		formDataObj.append("lastName", formData.lastName);
		formDataObj.append("phone", formData.phone);
		formDataObj.append("email", formData.email);
		formDataObj.append("location", formData.location);
		formDataObj.append("totalHogs", formData.totalHogs);
		formDataObj.append("validId", formData.validId);
		formDataObj.append("acceptedPrivacyPolicy", formData.acceptedPrivacyPolicy);
		
		// Convert locationImage from data URL to blob if it exists
		if (formData.locationImage) {
			const fetchRes = await fetch(formData.locationImage);
			const blob = await fetchRes.blob();
			formDataObj.append("locationImage", blob, "location-image.jpg");
		}
		
		formData.hogPhotos.forEach((photo, index) => {
			formDataObj.append(`hogPhoto${index}`, photo);
		});
		
		try {
			const response = await fetch("http://localhost:3000/register", {
				method: "POST",
				body: formDataObj,
			});
			
			const data = await response.json();
			if (response.ok) {
				alert("Registration successful!");
				navigate("/dashboard");
			} else {
				alert(data.error || "Registration failed.");
			}
		} catch (error) {
			console.error("Error:", error);
			alert("Something went wrong. Please try again.");
		}
	};

	// Ensure phone always starts with +639
	useEffect(() => {
		if (!formData.phone.startsWith('+639')) {
			setFormData(prev => ({...prev, phone: '+639'}));
		}
	}, [formData.phone]);
	
	// Clean up camera resources when component unmounts
	useEffect(() => {
		return () => {
			if (mediaStreamRef.current) {
				mediaStreamRef.current.getTracks().forEach(track => track.stop());
			}
		};
	}, []);

	return (
		<div className="registration-container">
			<div className="registration-card">
				<div className="logo-container">
					<img src={logo} alt="Balayan Hog Registration" className="logo" />
				</div>
				
				{showCamera ? (
					<div className="camera-container">
						<h2>Capture Location with Camera</h2>
						<div style={{ 
							width: '100%', 
							height: '300px', 
							backgroundColor: '#000', 
							position: 'relative',
							borderRadius: '10px',
							overflow: 'hidden',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center'
						}}>
							<video 
								ref={videoRef} 
								autoPlay 
								playsInline
								muted
								style={{ 
									width: '100%', 
									height: '100%', 
									objectFit: 'contain' 
								}}
							></video>
							{!cameraReady && (
								<div style={{
									position: 'absolute',
									color: 'white',
									background: 'rgba(0,0,0,0.7)',
									padding: '10px',
									borderRadius: '5px'
								}}>
									Initializing camera...
								</div>
							)}
						</div>
						<canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
						{locationError && <span className="error-message">{locationError}</span>}
						<div className="camera-controls">
							<button 
								type="button" 
								className="camera-btn capture" 
								onClick={captureLocation}
								disabled={!cameraReady}
							>
								{cameraReady ? 'Capture Location' : 'Waiting for camera...'}
							</button>
							<button type="button" className="camera-btn cancel" onClick={cancelCapture}>
								Cancel
							</button>
						</div>
					</div>
				) : (
					<div className="registration-content">
						<h1 className="registration-title">Balayan Hog Registration</h1>
						<p className="registration-subtitle">For hog raisers of Balayan, Batangas</p>
						
						<form className="registration-form" onSubmit={handleRegister}>
							<div className="input-group">
								<label>Name<span className="required">*</span></label>
								<div className="name-container">
									<div className="input-wrapper">
										<input 
											type="text" 
											name="firstName" 
											placeholder="First Name" 
											value={formData.firstName} 
											onChange={handleChange} 
										/>
										{errors.firstName && <span className="error-message">{errors.firstName}</span>}
									</div>
									<div className="input-wrapper">
										<input 
											type="text" 
											name="lastName" 
											placeholder="Last Name" 
											value={formData.lastName} 
											onChange={handleChange} 
										/>
										{errors.lastName && <span className="error-message">{errors.lastName}</span>}
									</div>
								</div>
							</div>

							<div className="input-group">
								<label>Contact Number<span className="required">*</span></label>
								<div className="input-wrapper">
									<input 
										type="text"
										name="phone"
										placeholder="+639xxxxxxxxx"
										value={formData.phone}
										onChange={handlePhoneChange}
									/>
									{errors.phone && <span className="error-message">{errors.phone}</span>}
								</div>
							</div>

							<div className="input-group">
								<label>Email Address<span className="required">*</span></label>
								<div className="input-wrapper">
									<input 
										type="email" 
										name="email" 
										placeholder="Email" 
										value={formData.email} 
										onChange={handleChange} 
									/>
									{errors.email && <span className="error-message">{errors.email}</span>}
								</div>
							</div>

							<div className="input-group">
								<label>Location<span className="required">*</span></label>
								<div className="location-container">
									<div className="location-buttons">
										<button 
											type="button" 
											className="location-btn"
											onClick={handleGetLocation}
											disabled={locationLoading}
										>
											{locationLoading ? "Getting location..." : "Get Current Location"}
										</button>
										<button
											type="button"
											className="location-btn geocam"
											onClick={startCamera}
											disabled={locationLoading}
										>
											GeoCam
										</button>
									</div>
									
									{formData.location && (
										<div className="location-display">
											<p>{formData.location}</p>
											
											{formData.locationImage && (
												<div className="location-image-container">
													<img 
														src={formData.locationImage} 
														alt="Location" 
														className="location-image" 
													/>
													<button 
														type="button" 
														className="remove-btn"
														onClick={removeLocationPhoto}
													>
														Remove Photo
													</button>
												</div>
											)}
										</div>
									)}
									{locationError && <span className="error-message">{locationError}</span>}
									{errors.location && <span className="error-message">{errors.location}</span>}
								</div>
							</div>

							<div className="input-group">
								<label>Total Number of Hogs<span className="required">*</span></label>
								<div className="hog-input-container">
									<div className="input-toggle">
										<button 
											type="button" 
											className={`toggle-btn ${hogInputType === "input" ? "active" : ""}`}
											onClick={() => setHogInputType("input")}
										>
											Manual
										</button>
										<button 
											type="button" 
											className={`toggle-btn ${hogInputType === "dropdown" ? "active" : ""}`}
											onClick={() => setHogInputType("dropdown")}
										>
											Dropdown
										</button>
									</div>
									
									{hogInputType === "input" ? (
										<input 
											type="text"
											name="totalHogs"
											placeholder="Enter number of hogs"
											value={formData.totalHogs}
											onChange={handleTotalHogsChange}
										/>
									) : (
										<select 
											name="totalHogs" 
											value={formData.totalHogs} 
											onChange={handleChange}
										>
											{[...Array(100)].map((_, i) => (
												<option key={i+1} value={i+1}>{i+1}</option>
											))}
										</select>
									)}
									{errors.totalHogs && <span className="error-message">{errors.totalHogs}</span>}
								</div>
							</div>

							<div className="input-group">
								<label>Valid ID<span className="required">*</span></label>
								<div className="file-upload-container">
									<label className="file-upload-btn">
										Upload Valid ID
										<input 
											type="file" 
											accept="image/*" 
											onChange={handleValidIdUpload} 
										/>
									</label>
									{formData.validId && (
										<div className="file-preview">
											<p>{formData.validId.name}</p>
										</div>
									)}
									{errors.validId && <span className="error-message">{errors.validId}</span>}
								</div>
							</div>

							<div className="input-group">
								<label>Hog Photos (Maximum 3)<span className="required">*</span></label>
								<div className="file-upload-container">
									<label className="file-upload-btn">
										Upload Photos
										<input 
											type="file" 
											accept="image/*" 
											multiple 
											onChange={handleHogPhotosUpload} 
											disabled={formData.hogPhotos.length >= 3}
										/>
									</label>
									{formData.hogPhotos.length > 0 && (
										<div className="photos-preview">
											{formData.hogPhotos.map((photo, index) => (
												<div key={index} className="photo-item">
													<p>{photo.name}</p>
													<button 
														type="button" 
														className="remove-btn"
														onClick={() => removeHogPhoto(index)}
													>
														Remove
													</button>
												</div>
											))}
										</div>
									)}
									{errors.hogPhotos && <span className="error-message">{errors.hogPhotos}</span>}
								</div>
							</div>

							<div className="input-group privacy-checkbox-container">
								<div className="checkbox-wrapper">
									<input
										type="checkbox"
										id="privacyCheckbox"
										name="acceptedPrivacyPolicy"
										checked={formData.acceptedPrivacyPolicy}
										onChange={handleCheckboxChange}
									/>
									<label htmlFor="privacyCheckbox" className="privacy-label">
										I have read and agree to the <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
										<span className="required">*</span>
									</label>
								</div>
								{errors.acceptedPrivacyPolicy && (
									<span className="error-message">{errors.acceptedPrivacyPolicy}</span>
								)}
							</div>

							<button type="submit" className="register-btn">Register</button>
						</form>
					</div>
				)}
			</div>
		</div>
	);
}