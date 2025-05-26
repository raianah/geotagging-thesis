import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { register, getProfile } from "../services/api";
import "../css/RegistrationCSS.css";
import logo from '../img/logo.png';

export default function RegistrationForm() {
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		phone: "",
		location: "",
		locationImage: null,
		validIdType: "",
		validId: null,
		hogList: [],
		hogPhotos: [],
		acceptedPrivacyPolicy: false,
		role: "user"
	});
	
	const [errors, setErrors] = useState({});
	const [locationLoading, setLocationLoading] = useState(false);
	const [locationError, setLocationError] = useState("");
	const [showCamera, setShowCamera] = useState(false);
	const [cameraReady, setCameraReady] = useState(false);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(null);
	
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const mediaStreamRef = useRef(null);
	
	const navigate = useNavigate();

	// Add this constant for Balayan barangays
	const BALAYAN_BARANGAYS = [
		"Brgy. Caloocan, Balayan, Batangas",
		"Brgy. Canda, Balayan, Batangas",
		"Brgy. Lucban, Balayan, Batangas",
		"Brgy. Gumamela, Balayan, Batangas",
		"Brgy. Poblacion, Balayan, Batangas",
		"Brgy. San Juan, Balayan, Batangas",
		"Brgy. San Piro, Balayan, Batangas",
		"Brgy. San Roque, Balayan, Batangas",
		"Brgy. San Sebastian, Balayan, Batangas",
		"Brgy. San Vicente, Balayan, Batangas"
	];

	// Add new state for tracking location methods
	const [locationMethodsAttempted, setLocationMethodsAttempted] = useState({
		gps: false,
		geocam: false
	});

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
	
	const isLocationInBalayan = (locationString) => {
		// Convert to lowercase for case-insensitive comparison
		const locationLower = locationString.toLowerCase();
		
		// Check if the location contains "balayan" and "batangas"
		const containsBalayan = locationLower.includes("balayan");
		const containsBatangas = locationLower.includes("batangas");
		
		return containsBalayan && containsBatangas;
	};

	const validateEmail = (email) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(email);
	};

	const checkCoordinatesInBalayan = async (latitude, longitude) => {
		try {
			// First, validate against the expanded boundaries
			const isInBoundary = (
				latitude >= 13.8800 && latitude <= 13.9700 && // Expanded latitude range
				longitude >= 120.6800 && longitude <= 120.7800 // Expanded longitude range
			);

			if (!isInBoundary) {
				return false;
			}

			// Use a more specific geocoding query with parameters to get detailed result
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
			);
			const data = await response.json();
			
			// Check address details specifically for Balayan and Batangas
			if (data.address) {
				const city = (data.address.city || "").toLowerCase();
				const municipality = (data.address.municipality || "").toLowerCase();
				const county = (data.address.county || "").toLowerCase();
				const state = (data.address.state || "").toLowerCase();
				const village = (data.address.village || "").toLowerCase();
				const suburb = (data.address.suburb || "").toLowerCase();
				
				// Check if any of these fields contain "balayan"
				const isBalayan = 
				city.includes("balayan") || 
				municipality.includes("balayan") || 
					county.includes("balayan") ||
					village.includes("balayan") ||
					suburb.includes("balayan");
				
				// Check if state/province is Batangas
				const isBatangas = state.includes("batangas");
				
				if (isBalayan && isBatangas) {
					return true;
			}
			
				// If we can't determine from address details, check the display name
				if (data.display_name) {
					return isLocationInBalayan(data.display_name);
				}
			}
			
			// If we still can't determine, check if the coordinates are within a reasonable distance
			// of known Balayan landmarks (e.g., Balayan Municipal Hall)
			const balayanCenter = {
				lat: 13.9335,
				lng: 120.7320
			};
			
			// Calculate distance using Haversine formula
			const distance = calculateDistance(
				latitude,
				longitude,
				balayanCenter.lat,
				balayanCenter.lng
			);
			
			// If within 5km of Balayan center, consider it valid
			return distance <= 5;
			} catch (error) {
			console.error("Error checking coordinates:", error);
			return false;
		}
	};

	// Add Haversine formula for distance calculation
	const calculateDistance = (lat1, lon1, lat2, lon2) => {
		const R = 6371; // Earth's radius in kilometers
		const dLat = toRad(lat2 - lat1);
		const dLon = toRad(lon2 - lon1);
		const a = 
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
			Math.sin(dLon/2) * Math.sin(dLon/2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return R * c;
	};

	const toRad = (value) => {
		return value * Math.PI / 180;
	};

	const handleGetLocation = () => {
		setLocationLoading(true);
		setLocationError("");
		setLocationMethodsAttempted(prev => ({ ...prev, gps: true }));
		
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const { latitude, longitude } = position.coords;
					
					try {
						// First check if the coordinates are in Balayan
						const isInBalayan = await checkCoordinatesInBalayan(latitude, longitude);
						
						// Use reverse geocoding to get address
						const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
						const data = await response.json();
						const location = data.display_name || `Lat: ${latitude}, Long: ${longitude}`;
						
						if (isInBalayan) {
							setFormData(prev => ({ 
								...prev, 
								location,
								latitude,
								longitude
							}));
							setLocationLoading(false);
							// Clear any previous errors
							setErrors(prev => ({ ...prev, location: "" }));
						} else {
							setLocationError("Registration is only available for locations in Balayan, Batangas. Please ensure you are within the municipality.");
							setLocationLoading(false);
						}
					} catch (error) {
						setLocationError("Failed to verify location. Please try again or use GeoCam.");
						setLocationLoading(false);
					}
				},
				(error) => {
					let errorMessage = "Failed to get location. Please try again.";
					
					// Provide more specific error messages based on the error code
					switch(error.code) {
						case error.PERMISSION_DENIED:
							errorMessage = "Location access denied. Please enable location services to register.";
							break;
						case error.POSITION_UNAVAILABLE:
							errorMessage = "Location information is unavailable. Please try again later.";
							break;
						case error.TIMEOUT:
							errorMessage = "Location request timed out. Please try again.";
							break;
					}
					
					setLocationError(errorMessage);
					setLocationLoading(false);
				}
			);
		} else {
			setLocationError("Geolocation is not supported by this browser. Please use a modern browser with location services.");
			setLocationLoading(false);
		}
	};
	
	// Start the camera for geocam-like functionality
	const startCamera = async () => {
		try {
			setLocationMethodsAttempted(prev => ({ ...prev, geocam: true }));
			console.log("Starting camera...");
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
			setLocationError("Geolocation is not supported by this browser. Please use a modern browser with location services.");
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
			async (position) => {
				const { latitude, longitude } = position.coords;
				
				// Capture image from video stream
				const canvas = canvasRef.current;
				const video = videoRef.current;
				
				if (canvas && video) {
					try {
						// Draw the video frame to the canvas
						const context = canvas.getContext('2d');
						canvas.width = video.videoWidth || 640;
						canvas.height = video.videoHeight || 480;
						context.drawImage(video, 0, 0, canvas.width, canvas.height);
						
						// Convert canvas to image data URL
						const imageDataUrl = canvas.toDataURL('image/jpeg');
						
						try {
							// Check if location is in Balayan
							const isInBalayan = await checkCoordinatesInBalayan(latitude, longitude);
							
							// Get address for display
							const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
							const data = await response.json();
							const location = data.display_name || `Lat: ${latitude}, Long: ${longitude}`;
							
							if (isInBalayan) {
								setFormData(prev => ({ 
									...prev, 
									location,
									locationImage: imageDataUrl,
									latitude,
									longitude
								}));
								setLocationLoading(false);
								stopCamera();
								// Clear any previous errors
								setErrors({...errors, location: ""});
							} else {
								setLocationError("Registration is only available for locations in Balayan, Batangas. Please ensure you are within the municipality.");
								setLocationLoading(false);
								stopCamera();
							}
						} catch (error) {
							setLocationError("Failed to verify location. Please try again.");
							setLocationLoading(false);
							stopCamera();
						}
					} catch (drawError) {
						console.error("Error drawing to canvas:", drawError);
						setLocationError("Failed to capture image. Please try again.");
						setLocationLoading(false);
						stopCamera();
					}
				} else {
					console.error("Canvas or video element not available");
					setLocationError("Failed to capture: Camera not available. Please try again.");
					setLocationLoading(false);
					stopCamera();
				}
			},
			(error) => {
				let errorMessage = "Failed to get location. Please try again.";
				
				// Provide more specific error messages based on the error code
				switch(error.code) {
					case error.PERMISSION_DENIED:
						errorMessage = "Location access denied. Please enable location services to register.";
						break;
					case error.POSITION_UNAVAILABLE:
						errorMessage = "Location information is unavailable. Please try again later.";
						break;
					case error.TIMEOUT:
						errorMessage = "Location request timed out. Please try again.";
						break;
				}
				
				setLocationError(errorMessage);
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

			// Convert file to base64
			const reader = new FileReader();
			reader.onload = (event) => {
				setFormData({ ...formData, validId: file, validIdBase64: event.target.result });
			};
			reader.onerror = () => {
				setErrors({...errors, validId: "Failed to read image file"});
			};
			reader.readAsDataURL(file);
			
			setErrors({...errors, validId: ""});
		}
	};

	const handleAddHog = () => {
		setFormData(prev => ({
			...prev,
			hogList: [
				...prev.hogList,
				{
					breed: "",
					gender: "",
					birthdate: "",
					photos: []
				}
			]
		}));
	};

	const handleHogChange = (index, field, value) => {
		const updatedHogs = [...formData.hogList];
		updatedHogs[index] = { ...updatedHogs[index], [field]: value };
		setFormData({ ...formData, hogList: updatedHogs });
	};

	const handleRemoveHog = (index) => {
		const updatedHogs = [...formData.hogList];
		updatedHogs.splice(index, 1);
		setFormData({ ...formData, hogList: updatedHogs });
	};

	const HogEntry = ({ index, hog, onChange, onRemove }) => {
		return (
			<div className="hog-entry">
				<div className="hog-entry-header">
					<h4>Hog #{index + 1}</h4>
					<button 
						type="button" 
						className="remove-btn"
						onClick={() => onRemove(index)}
					>
						Remove
					</button>
				</div>
				<div className="hog-entry-form">
					<div className="hog-field">
						<label>Breed<span className="required">*</span></label>
						<select 
							name="breed" 
							value={hog.breed} 
							onChange={(e) => onChange(index, "breed", e.target.value)}
							required
						>
							<option value="">Select Breed</option>
							<option value="Native (Native Black)">Native (Native Black)</option>
							<option value="Large White">Large White</option>
							<option value="Landrace">Landrace</option>
							<option value="Duroc">Duroc</option>
							<option value="Hampshire">Hampshire</option>
							<option value="Berkshire">Berkshire</option>
							<option value="Pietrain">Pietrain</option>
							<option value="Chester White">Chester White</option>
							<option value="Crossbreed">Crossbreed</option>
							<option value="Other">Other</option>
						</select>
					</div>
					<div className="hog-field">
						<label>Gender<span className="required">*</span></label>
						<div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
							<div style={{ display: 'flex', alignItems: 'center' }}>
							<input
								type="radio"
								id={`gender-male-${index}`}
								name={`gender-${index}`}
								value="male"
								checked={hog.gender === "male"}
								onChange={() => onChange(index, "gender", "male")}
								style={{ marginRight: '8px', marginTop: '0', marginBottom: '0' }}
							/>
							<label 
								htmlFor={`gender-male-${index}`}
								style={{ margin: '0', fontSize: '14px', display: 'inline' }}
							>
								Male
							</label>
							</div>
							<div style={{ display: 'flex', alignItems: 'center' }}>
							<input
								type="radio"
								id={`gender-female-${index}`}
								name={`gender-${index}`}
								value="female"
								checked={hog.gender === "female"}
								onChange={() => onChange(index, "gender", "female")}
								style={{ marginRight: '8px', marginTop: '0', marginBottom: '0' }}
							/>
							<label 
								htmlFor={`gender-female-${index}`}
								style={{ margin: '0', fontSize: '14px', display: 'inline' }}
							>
								Female
							</label>
							</div>
						</div>
					</div>
					<div className="hog-field">
						<label>Birthdate<span className="required">*</span></label>
						<input
							type="date"
							value={hog.birthdate}
							onChange={(e) => onChange(index, "birthdate", e.target.value)}
							required
							max={new Date().toISOString().split('T')[0]} // Cannot select future dates
						/>
					</div>
					<div className="hog-field">
						<label>Photos (Max 2)<span className="required">*</span></label>
						<div className="file-upload-container">
							<label className="file-upload-btn">
								Upload Photos
								<input 
									type="file" 
									accept="image/*" 
									multiple 
									onChange={(e) => {
										const files = Array.from(e.target.files);
										// Check if adding these would exceed 2 photos per hog
										if (hog.photos.length + files.length > 2) {
											alert("Maximum 2 photos per hog allowed");
											return;
										}
										onChange(index, "photos", [...hog.photos, ...files]);
									}} 
									disabled={hog.photos.length >= 3}
								/>
							</label>
							{hog.photos.length > 0 && (
								<div className="photos-preview">
									{hog.photos.map((photo, photoIndex) => (
										<div key={photoIndex} className="photo-preview">
											<img 
												src={URL.createObjectURL(photo)} 
												alt={`Hog ${index+1} photo ${photoIndex+1}`}
												className="preview-image"
											/>
											<button 
												type="button" 
												className="remove-preview-btn"
												onClick={() => {
													const updatedPhotos = [...hog.photos];
													updatedPhotos.splice(photoIndex, 1);
													onChange(index, "photos", updatedPhotos);
												}}
											>
												✕
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	};
	
	const removeLocationPhoto = () => {
		setFormData({ ...formData, locationImage: null });
	};

	const validateForm = () => {
		const newErrors = {};
		
		if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
		if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
		
		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 8) {
			newErrors.password = "Password must be at least 8 characters long";
		}
		
		if (!formData.phone || formData.phone.length !== 13) {
			newErrors.phone = "Phone number must be started with +639 followed by 9 digits";
		}
		
		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!validateEmail(formData.email)) {
			newErrors.email = "Please enter a valid email address";
		}
		
		if (!formData.location) {
			newErrors.location = "Location is required";
		} else if (!isLocationInBalayan(formData.location)) {
			newErrors.location = "Only locations in Balayan, Batangas are eligible for registration";
		}
		
		if (!formData.acceptedPrivacyPolicy) {
			newErrors.acceptedPrivacyPolicy = "You must agree to the Privacy Policy";
		}
		
		if (!formData.validIdType) {
			newErrors.validIdType = "Please select an ID type";
		}
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleRegister = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;
		setLoading(true);
		setErrors({});
		setSuccess(null);
		try {
			await register({
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: formData.email,
				password: formData.password,
				phone: formData.phone,
				role: formData.role,
				location: formData.location,
				validIdType: formData.validIdType,
				validIdUrl: formData.validIdBase64 || null,
				latitude: formData.latitude,
				longitude: formData.longitude
			});
			setLoading(false);
			setSuccess("Registration successful! Redirecting to login...");
			setTimeout(() => navigate("/login"), 2000);
		} catch (error) {
			setLoading(false);
			setErrors({ form: error.message || "Registration failed. Please try again." });
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
				<div className="reg-logo-container">
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
							<div className="input-group-reg">
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

							<div className="input-group-reg">
								<label>Password<span className="required">*</span></label>
								<div className="input-wrapper">
									<input 
										type="password" 
										name="password" 
										placeholder="Enter password (min. 8 characters)" 
										value={formData.password} 
										onChange={handleChange} 
									/>
									{errors.password && <span className="error-message">{errors.password}</span>}
								</div>
							</div>

							<div className="input-group-reg">
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

							<div className="input-group-reg">
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

							<div className="input-group-reg">
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

							<div className="input-group-reg hog-management-section">
								<div className="hog-management-header">
									<label>Hogs<span className="required">*</span></label>
									<button 
										type="button" 
										className="add-hog-btn"
										onClick={handleAddHog}
									>
										+ Add Hog
									</button>
								</div>
								
								{formData.hogList.length === 0 ? (
									<div className="no-hogs-message">
										<p>No hogs added yet. Click the button above to add a hog.</p>
									</div>
								) : (
									<div className="hog-list">
										{formData.hogList.map((hog, index) => (
											<HogEntry 
												key={index}
												index={index}
												hog={hog}
												onChange={handleHogChange}
												onRemove={handleRemoveHog}
											/>
										))}
									</div>
								)}
								
								{errors.hogList && <span className="error-message">{errors.hogList}</span>}
								{errors.hogErrors && (
									<div className="hog-errors">
										{formData.hogList.map((_, index) => 
											errors.hogErrors[index] ? (
												<div key={index} className="hog-error">
													<p>Hog #{index+1} has errors:</p>
													<ul>
														{Object.entries(errors.hogErrors[index]).map(([field, error]) => (
															<li key={field}>{error}</li>
														))}
													</ul>
												</div>
											) : null
										)}
									</div>
								)}
							</div>

							<div className="input-group-reg">
								<label>Valid ID<span className="required">*</span></label>
								<div className="id-container">
									<select
										name="validIdType"
										value={formData.validIdType}
										onChange={handleChange}
										className="id-select"
									>
										<option value="">Select ID Type</option>
										<option value="Philippine Passport">Philippine Passport</option>
										<option value="SSS ID">SSS ID</option>
										<option value="GSIS ID">GSIS ID</option>
										<option value="PhilHealth ID">PhilHealth ID</option>
										<option value="Voter's ID">Voter's ID</option>
										<option value="Driver's License">Driver's License</option>
										<option value="PRC ID">PRC ID</option>
										<option value="NBI Clearance">NBI Clearance</option>
										<option value="PhilSys National ID">PhilSys National ID</option>
										<option value="Postal ID">Postal ID</option>
										<option value="Barangay ID">Barangay ID</option>
									</select>
									{errors.validIdType && <span className="error-message">{errors.validIdType}</span>}
								</div>
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
											<div className="image-preview-container">
												<img 
													src={URL.createObjectURL(formData.validId)} 
													alt="ID Preview" 
													className="id-preview-image"
												/>
												<button 
													type="button" 
													className="remove-btn"
													onClick={() => setFormData({...formData, validId: null})}
												>
													Remove
												</button>
											</div>
											<p>{formData.validId.name}</p>
										</div>
									)}
									{errors.validId && <span className="error-message">{errors.validId}</span>}
								</div>
							</div>

							<div className="input-group-reg privacy-checkbox-container">
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

							{errors.form && <span className="error-message">{errors.form}</span>}
							{success && <span className="success-message">{success}</span>}
							<button type="submit" className="register-btn" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
						</form>
					</div>
				)}
			</div>
		</div>
	);
}