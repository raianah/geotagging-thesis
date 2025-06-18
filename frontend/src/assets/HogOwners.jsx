import React, { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { FaCopy, FaCheck } from "react-icons/fa";
import { getAccounts, getHogOwnerDetails, getRejectedAccounts } from "../services/api";
import "../css/HogOwners.css";

const HogOwners = ({ isOpen, onClose }) => {
    const [accounts, setAccounts] = useState([]);
    const [rejectedAccounts, setRejectedAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [activeTab, setActiveTab] = useState('verified'); // 'verified', 'pending', or 'rejected'

    const formatCoordinate = (coord) => {
        const num = Number(coord);
        return !isNaN(num) ? num.toFixed(6) : 'Invalid';
    };

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        
        const fetchData = async () => {
            try {
                const [accountsData, rejectedData] = await Promise.all([
                    getAccounts(),
                    getRejectedAccounts()
                ]);
                setAccounts(accountsData);
                setRejectedAccounts(rejectedData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen]);

    // Filter accounts based on active tab and search query
    const filteredAccounts = (() => {
        let filtered = [];
            const q = search.toLowerCase();

        switch (activeTab) {
            case 'verified':
                filtered = accounts.filter(acc => 
                    acc.role?.toLowerCase() === 'user' && 
                    acc.status?.toLowerCase() === 'verified'
                );
                break;
            case 'pending':
                filtered = accounts.filter(acc => 
                    acc.role?.toLowerCase() === 'user' && 
                    acc.status?.toLowerCase() === 'pending'
                );
                break;
            case 'rejected':
                filtered = rejectedAccounts;
                break;
            default:
                filtered = [];
        }

        return filtered.filter(owner => {
            return (
                owner.fullName?.toLowerCase().includes(q) ||
                owner.emailAddress?.toLowerCase().includes(q) ||
                (owner.contactNumber || "").toLowerCase().includes(q)
            );
        });
    })();

    const handleViewOwner = async (owner) => {
        setLoadingDetails(true);
        setDetailsError(null);
        try {
            const details = await getHogOwnerDetails(owner.uid);
            // Ensure validIdUrl is properly formatted
            if (details.validIdUrl) {
                // If it's a base64 string, it's already in the correct format
                if (!details.validIdUrl.startsWith('data:image')) {
                    // If it's a relative path, make it absolute
                    if (details.validIdUrl.startsWith('/')) {
                        details.validIdUrl = `${window.location.origin}${details.validIdUrl}`;
                    }
                    // If it's a blob URL, log a warning
                    if (details.validIdUrl.startsWith('blob:')) {
                        console.warn('Received blob URL for Valid ID, this may not persist after page refresh');
                    }
                }
            }
            setSelectedOwner(details);
        } catch (err) {
            setDetailsError(err.message);
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeOwnerDetails = () => {
        setSelectedOwner(null);
        setDetailsError(null);
    };

    const handleCopyId = async () => {
        if (selectedOwner?.uid) {
            try {
                await navigator.clipboard.writeText(selectedOwner.uid);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    const handleImageClick = (imageUrl) => {
        setLightboxImage(imageUrl);
    };

    const closeLightbox = () => {
        setLightboxImage(null);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="hog-owners-modal">
                <div className="modal-header">
                <h2>Hog Owners Directory</h2>
                <button className="close-button" onClick={onClose}>
                    <IoMdClose />
                </button>
                </div>
                <div className="hog-owners-content">
                    <div className="owners-tabs">
                        <button 
                            className={`tab-button ${activeTab === 'verified' ? 'active' : ''}`}
                            onClick={() => setActiveTab('verified')}
                        >
                            Approved
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            Pending
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
                            onClick={() => setActiveTab('rejected')}
                        >
                            Rejected
                        </button>
                    </div>
                <div className="owners-search">
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="owners-table-container">
                    {loading ? (
                        <div className="loading">Loading...</div>
                    ) : error ? (
                        <div className="error">{error}</div>
                    ) : (
                    <table className="owners-table">
                    <thead>
                        <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                                        {activeTab === 'rejected' && <th>Reason</th>}
                        <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                                    {filteredAccounts.map(owner => (
                        <tr key={owner.uid}>
                            <td>{owner.fullName}</td>
                            <td>{owner.emailAddress}</td>
                            <td>{owner.contactNumber}</td>
                                            <td>
                                                <span className={`status-badge ${owner.status?.toLowerCase()}`}>
                                                    {owner.status?.charAt(0).toUpperCase() + owner.status?.slice(1)}
                                                </span>
                                            </td>
                                            {activeTab === 'rejected' && (
                                                <td>{owner.rejectionReason || 'No reason provided'}</td>
                                            )}
                            <td>
                                                <button 
                                                    className="action-button view"
                                                    onClick={() => handleViewOwner(owner)}
                                                >
                                                    View
                                                </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    )}
                </div>
                </div>
            </div>

            {/* Owner Details Modal */}
            {selectedOwner && (
                <div className="modal-overlay" onClick={closeOwnerDetails}>
                    <div className="owner-details-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Hog Owner Details</h2>
                            <button className="close-button" onClick={closeOwnerDetails}>
                                <IoMdClose />
                            </button>
                        </div>
                        <div className="owner-details-content">
                            {loadingDetails ? (
                                <div className="loading">Loading details...</div>
                            ) : detailsError ? (
                                <div className="error">{detailsError}</div>
                            ) : selectedOwner ? (
                                <>
                                    {/* Account Overview Section */}
                                    <div className="owner-info-section account-overview">
                                        <div className="account-header">
                                            <div className="account-avatar">
                                                {selectedOwner.profilePicture ? (
                                                    <img src={selectedOwner.profilePicture} alt={selectedOwner.fullName} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {selectedOwner.fullName.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="account-title">
                                                <h3>{selectedOwner.fullName}</h3>
                                                <span className={`status-badge ${selectedOwner.status?.toLowerCase()}`}>
                                                    {selectedOwner.status?.charAt(0).toUpperCase() + selectedOwner.status?.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedOwner.status?.toLowerCase() === 'rejected' && selectedOwner.rejectionReason && (
                                            <div className="rejection-reason">
                                                <h4>Reason for Rejection</h4>
                                                <p>{selectedOwner.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact Information Section */}
                                    <div className="owner-info-section">
                                        <h3>Contact Information</h3>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">Email Address</span>
                                                <span className="info-value">{selectedOwner.emailAddress}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Contact Number</span>
                                                <span className="info-value">{selectedOwner.contactNumber || 'Not provided'}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Location</span>
                                                <span className="info-value">{selectedOwner.location || 'Not provided'}</span>
                                            </div>
                                            {selectedOwner.latitude && selectedOwner.longitude && (
                                                <div className="info-item coordinates">
                                                    <span className="info-label">Coordinates</span>
                                                    <span className="info-value">
                                                        {formatCoordinate(selectedOwner.latitude)}, {formatCoordinate(selectedOwner.longitude)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Valid ID Section */}
                                    {selectedOwner.validIdType && (
                                        <div className="owner-info-section">
                                            <h3>Valid ID Information</h3>
                                            <div className="info-grid">
                                                <div className="info-item">
                                                    <span className="info-label">ID Type</span>
                                                    <span className="info-value">{selectedOwner.validIdType}</span>
                                                </div>
                                            </div>
                                            {selectedOwner.validIdUrl && (
                                                <div className="valid-id-preview">
                                                    <h4>ID Preview</h4>
                                                    <img 
                                                        src={selectedOwner.validIdUrl} 
                                                        alt="Valid ID" 
                                                        className="valid-id-image"
                                                        onClick={() => handleImageClick(selectedOwner.validIdUrl)}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            // Use a data URI for the fallback image instead of a file path
                                                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                                                            console.error('Failed to load Valid ID image:', selectedOwner.validIdUrl);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Farms Information Section */}
                                    {selectedOwner.farms && selectedOwner.farms.length > 0 && (
                                        <div className="owner-info-section">
                                            <h3>Farms Information</h3>
                                            {selectedOwner.farms.map((farm, index) => (
                                                <div key={farm.id} className="farm-details">
                                                    <h4>Farm #{index + 1}: {farm.name}</h4>
                                                    <div className="info-grid">
                                                        <div className="info-item">
                                                            <span className="info-label">Location</span>
                                                            <span className="info-value">{farm.location}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="info-label">Farm Type</span>
                                                            <span className="info-value">{farm.farmType}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="info-label">Farm Size</span>
                                                            <span className="info-value">{farm.farmSize}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="info-label">Pig Count</span>
                                                            <span className="info-value">{farm.pigCount}</span>
                                                        </div>
                                                    </div>

                                                    {/* Hogs Information for this Farm */}
                                                    {farm.hogs && farm.hogs.length > 0 && (
                                                        <div className="farm-hogs">
                                                            <h5>Hogs in this Farm</h5>
                                                            <div className="hogs-summary">
                                                                <div className="summary-item">
                                                                    <span className="summary-label">Total Hogs</span>
                                                                    <span className="summary-value">{farm.hogs.length}</span>
                                                                </div>
                                                                <div className="summary-item">
                                                                    <span className="summary-label">Breeds</span>
                                                                    <span className="summary-value">
                                                                        {[...new Set(farm.hogs.map(hog => hog.breed))].join(', ')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="hogs-list">
                                                                {farm.hogs.map((hog, hogIndex) => (
                                                                    <div key={hog.id} className="hog-item">
                                                                        <div className="hog-info">
                                                                            <span className="hog-breed">Hog #{hogIndex + 1}</span>
                                                                            <span className="hog-details">
                                                                                {hog.breed} • {hog.gender} • Born: {new Date(hog.birthday).toLocaleDateString()}
                                                                            </span>
                                                                            {hog.healthStatus && (
                                                                                <span className={`hog-health ${hog.healthStatus.toLowerCase()}`}>
                                                                                    {hog.healthStatus}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {hog.photos && hog.photos.length > 0 && (
                                                                            <div className="hog-photos">
                                                                                {hog.photos.map((photo, photoIndex) => (
                                                                                    <img 
                                                                                        key={photoIndex}
                                                                                        src={photo}
                                                                                        alt={`Hog ${hogIndex + 1} photo ${photoIndex + 1}`}
                                                                                        className="hog-photo-thumbnail"
                                                                                        onClick={() => handleImageClick(photo)}
                                                                                    />
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : <div>No details found.</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Lightbox */}
            {lightboxImage && (
                <div className="image-lightbox" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeLightbox}>
                            <IoMdClose />
                        </button>
                        <img 
                            src={lightboxImage} 
                            alt="Enlarged view" 
                            className="lightbox-image"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default HogOwners;