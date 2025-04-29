import React, { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { getAccounts } from "../services/api";
import "../css/HogOwners.css";

const HogOwners = ({ isOpen, onClose }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        getAccounts()
            .then(data => {
                setAccounts(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [isOpen]);

    // Defensive: Only show accounts with role 'user' (case-insensitive) and valid status
    const hogOwners = accounts.filter(acc => acc.role && acc.role.toLowerCase() === 'user' && acc.status && ['verified','pending','rejected'].includes(acc.status.toLowerCase()));

    // Filter hog owners based on search query
    const filteredOwners = hogOwners
        .filter(owner => {
            const q = search.toLowerCase();
            return (
                owner.fullName.toLowerCase().includes(q) ||
                owner.emailAddress.toLowerCase().includes(q) ||
                (owner.contactNumber || "").toLowerCase().includes(q)
            );
        });

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
                        <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOwners.map(owner => (
                        <tr key={owner.uid}>
                            <td>{owner.fullName}</td>
                            <td>{owner.emailAddress}</td>
                            <td>{owner.contactNumber}</td>
                            <td>{owner.status ? (
                              <span className={`status-badge ${owner.status.toLowerCase()}`}>{owner.status.charAt(0).toUpperCase() + owner.status.slice(1)}</span>
                            ) : (
                              <span className="status-badge pending">Pending</span>
                            )}</td>
                            <td>
                            <button className="action-button view">View</button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
};

export default HogOwners;