import React from "react";
import { IoMdClose } from "react-icons/io";
import "../css/HogOwners.css";

const HogOwners = ({ isOpen, onClose }) => {
    // Dummy data for hog owners
    const hogOwners = [
        {
        id: 1,
        firstName: "Emma",
        lastName: "Johnson",
        email: "emma.johnson@example.com",
        phone: "(555) 234-5678",
        address: "123 Oak Street, Springfield, IL",
        numberOfHogs: 5,
        joinDate: "2023-10-15",
        lastVisit: "2025-04-08"
        },
        {
        id: 2,
        firstName: "Michael",
        lastName: "Smith",
        email: "michael.smith@example.com",
        phone: "(555) 876-5432",
        address: "456 Maple Avenue, Riverdale, NY",
        numberOfHogs: 3,
        joinDate: "2024-01-22",
        lastVisit: "2025-04-10"
        },
        {
        id: 3,
        firstName: "Sophia",
        lastName: "Williams",
        email: "sophia.williams@example.com",
        phone: "(555) 345-6789",
        address: "789 Pine Road, Laketown, CA",
        numberOfHogs: 8,
        joinDate: "2022-08-17",
        lastVisit: "2025-04-05"
        },
        {
        id: 4,
        firstName: "William",
        lastName: "Brown",
        email: "william.brown@example.com",
        phone: "(555) 987-6543",
        address: "321 Cedar Lane, Mountain View, CO",
        numberOfHogs: 2,
        joinDate: "2023-05-30",
        lastVisit: "2025-04-11"
        },
        {
        id: 5,
        firstName: "Olivia",
        lastName: "Davis",
        email: "olivia.davis@example.com",
        phone: "(555) 456-7890",
        address: "654 Birch Street, Seaside, FL",
        numberOfHogs: 6,
        joinDate: "2024-03-12",
        lastVisit: "2025-04-09"
        },
        {
        id: 6,
        firstName: "James",
        lastName: "Miller",
        email: "james.miller@example.com",
        phone: "(555) 765-4321",
        address: "987 Elm Boulevard, Hillside, TX",
        numberOfHogs: 4,
        joinDate: "2022-11-05",
        lastVisit: "2025-04-07"
        },
        {
        id: 7,
        firstName: "Charlotte",
        lastName: "Wilson",
        email: "charlotte.wilson@example.com",
        phone: "(555) 321-0987",
        address: "159 Willow Drive, Valley City, WA",
        numberOfHogs: 7,
        joinDate: "2023-07-19",
        lastVisit: "2025-04-12"
        },
        {
        id: 8,
        firstName: "Benjamin",
        lastName: "Taylor",
        email: "benjamin.taylor@example.com",
        phone: "(555) 890-1234",
        address: "753 Aspen Court, Meadowbrook, OR",
        numberOfHogs: 1,
        joinDate: "2024-02-28",
        lastVisit: "2025-04-06"
        },
        {
        id: 9,
        firstName: "Amelia",
        lastName: "Anderson",
        email: "amelia.anderson@example.com",
        phone: "(555) 543-2109",
        address: "246 Sycamore Path, Desert Springs, AZ",
        numberOfHogs: 9,
        joinDate: "2022-09-10",
        lastVisit: "2025-04-13"
        },
        {
        id: 10,
        firstName: "Ethan",
        lastName: "Thomas",
        email: "ethan.thomas@example.com",
        phone: "(555) 678-9012",
        address: "802 Redwood Circle, Forest Hills, MI",
        numberOfHogs: 3,
        joinDate: "2023-12-05",
        lastVisit: "2025-04-10"
        }
    ];

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
                    <input type="text" placeholder="Search by name, email or phone..." />
                </div>
                <div className="owners-table-container">
                    <table className="owners-table">
                    <thead>
                        <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Hogs</th>
                        <th>Last Visit</th>
                        <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hogOwners.map(owner => (
                        <tr key={owner.id}>
                            <td>{owner.firstName} {owner.lastName}</td>
                            <td>{owner.email}</td>
                            <td>{owner.phone}</td>
                            <td>{owner.numberOfHogs}</td>
                            <td>{owner.lastVisit}</td>
                            <td>
                            <button className="action-button view">View</button>
                            <button className="action-button message">Message</button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
        </div>
    );
};

export default HogOwners;