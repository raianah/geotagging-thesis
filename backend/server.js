import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./authMiddleware.js";
import crypto from "crypto";
import fetch from "node-fetch";
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

// Configure CORS with more specific options
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Increase payload limits
app.use(express.json({ 
    limit: '50mb',
    extended: true,
    parameterLimit: 50000
}));

app.use(express.urlencoded({ 
    limit: '50mb',
    extended: true,
    parameterLimit: 50000
}));

// Add headers middleware
app.use((req, res, next) => {
    // Dynamically set the allowed origin based on the request
    const origin = req.headers.origin;
    if (origin && (origin.includes('localhost:3000') || origin.includes('localhost:3001'))) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

let db;

// Initialize SQLite DB
async function initDB() {
    db = await open({
        filename: './temp.db',
        driver: sqlite3.Database
    });

    // Create users table with PostgreSQL-compatible structure
    await db.exec(`
        CREATE TABLE IF NOT EXISTS blnbtghog_owners (
            uid VARCHAR(36) PRIMARY KEY,
            fullName VARCHAR(255) NOT NULL,
            emailAddress VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            contactNumber VARCHAR(20) NOT NULL,
            userCreated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            profilePicture VARCHAR(255),
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            location TEXT,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            validIdType VARCHAR(50),
            validIdUrl VARCHAR(255),
            lastLogin TIMESTAMP,
            isActive BOOLEAN DEFAULT true,
            verificationToken VARCHAR(255),
            verificationTokenExpiry TIMESTAMP,
            resetPasswordToken VARCHAR(255),
            resetPasswordExpiry TIMESTAMP,
            CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
            CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
            CONSTRAINT valid_phone CHECK (contactNumber LIKE '+639%')
        );

        CREATE INDEX IF NOT EXISTS idx_email ON blnbtghog_owners(emailAddress);
        CREATE INDEX IF NOT EXISTS idx_status ON blnbtghog_owners(status);
        CREATE INDEX IF NOT EXISTS idx_role ON blnbtghog_owners(role);
        CREATE INDEX IF NOT EXISTS idx_verification_token ON blnbtghog_owners(verificationToken);
    `);

    // Create farms table with improved structure
    await db.exec(`
        CREATE TABLE IF NOT EXISTS farms (
            id VARCHAR(36) PRIMARY KEY,
            ownerUid VARCHAR(36) NOT NULL,
            branchName VARCHAR(255) NOT NULL,
            address TEXT NOT NULL,
            city VARCHAR(100) NOT NULL,
            province VARCHAR(100) NOT NULL,
            pigCount INTEGER NOT NULL DEFAULT 0,
            farmSize DECIMAL(10, 2) NOT NULL,
            farmType VARCHAR(50) NOT NULL,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            FOREIGN KEY(ownerUid) REFERENCES blnbtghog_owners(uid) ON DELETE CASCADE,
            CONSTRAINT valid_farm_latitude CHECK (latitude >= -90 AND latitude <= 90),
            CONSTRAINT valid_farm_longitude CHECK (longitude >= -180 AND longitude <= 180),
            CONSTRAINT valid_pig_count CHECK (pigCount >= 0),
            CONSTRAINT valid_farm_size CHECK (farmSize > 0)
        );

        CREATE INDEX IF NOT EXISTS idx_farm_owner ON farms(ownerUid);
        CREATE INDEX IF NOT EXISTS idx_farm_status ON farms(status);
        CREATE INDEX IF NOT EXISTS idx_farm_location ON farms(city, province);
    `);

    // Create ASF outbreak reports table with improved structure
    await db.exec(`
        CREATE TABLE IF NOT EXISTS asf_outbreak_reports (
            id VARCHAR(36) PRIMARY KEY,
            dateReported TIMESTAMP NOT NULL,
            barangay VARCHAR(100) NOT NULL,
            municipality VARCHAR(100) NOT NULL,
            province VARCHAR(100) NOT NULL,
            reportedByUid VARCHAR(36) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            severity VARCHAR(20) NOT NULL DEFAULT 'low',
            affectedPigCount INTEGER NOT NULL DEFAULT 0,
            isVerified BOOLEAN DEFAULT false,
            verifiedByUid VARCHAR(36),
            verificationDate TIMESTAMP,
            FOREIGN KEY(reportedByUid) REFERENCES blnbtghog_owners(uid) ON DELETE SET NULL,
            FOREIGN KEY(verifiedByUid) REFERENCES blnbtghog_owners(uid) ON DELETE SET NULL,
            CONSTRAINT valid_report_latitude CHECK (latitude >= -90 AND latitude <= 90),
            CONSTRAINT valid_report_longitude CHECK (longitude >= -180 AND longitude <= 180),
            CONSTRAINT valid_affected_count CHECK (affectedPigCount >= 0),
            CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
        );

        CREATE INDEX IF NOT EXISTS idx_report_date ON asf_outbreak_reports(dateReported);
        CREATE INDEX IF NOT EXISTS idx_report_status ON asf_outbreak_reports(status);
        CREATE INDEX IF NOT EXISTS idx_report_location ON asf_outbreak_reports(barangay, municipality, province);
        CREATE INDEX IF NOT EXISTS idx_report_severity ON asf_outbreak_reports(severity);
    `);

    // Create audit log table for tracking changes
    await db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(36) PRIMARY KEY,
            tableName VARCHAR(50) NOT NULL,
            recordId VARCHAR(36) NOT NULL,
            action VARCHAR(20) NOT NULL,
            oldData TEXT,
            newData TEXT,
            userId VARCHAR(36),
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES blnbtghog_owners(uid) ON DELETE SET NULL,
            CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
        );

        CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(tableName);
        CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_logs(recordId);
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    `);

    // Create hogs table with PostgreSQL-compatible structure
    await db.exec(`
        CREATE TABLE IF NOT EXISTS hogs (
            id VARCHAR(36) PRIMARY KEY,
            farmId VARCHAR(36) NOT NULL,
            breed VARCHAR(100) NOT NULL,
            gender VARCHAR(10) NOT NULL,
            birthday DATE NOT NULL,
            photos TEXT, -- JSON array of photo URLs/base64
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(farmId) REFERENCES farms(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_hog_farm ON hogs(farmId);
    `);

    // Create notifications table with improved structure
    await db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(36) PRIMARY KEY,
            userId VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL DEFAULT 'info',
            isRead BOOLEAN DEFAULT false,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES blnbtghog_owners(uid) ON DELETE CASCADE,
            CONSTRAINT unique_notification_per_user UNIQUE (id, userId)
        );

        CREATE INDEX IF NOT EXISTS idx_notification_user ON notifications(userId);
        CREATE INDEX IF NOT EXISTS idx_notification_read ON notifications(isRead);
        CREATE INDEX IF NOT EXISTS idx_notification_created ON notifications(createdAt);
    `);
}

// Add audit logging function
async function logAudit(tableName, recordId, action, oldData, newData, userId) {
    try {
        await db.run(
            `INSERT INTO audit_logs (id, tableName, recordId, action, oldData, newData, userId)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), tableName, recordId, action, JSON.stringify(oldData), JSON.stringify(newData), userId]
        );
    } catch (error) {
        console.error('Audit logging error:', error);
    }
}

// Login route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await db.get(`SELECT * FROM blnbtghog_owners WHERE emailAddress = ?`, [email]);

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { uid: user.uid },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            user: {
                uid: user.uid,
                fullName: user.fullName,
                emailAddress: user.emailAddress,
            },
            token
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Register route
app.post("/register", async (req, res) => {
    const { 
        firstName, lastName, email, password, phone, role, 
        validIdType, validIdUrl, location, latitude, longitude 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !role) {
        return res.status(400).json({ error: "All required fields must be provided" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate phone format (Philippine format)
    const phoneRegex = /^\+639\d{9}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: "Phone number must be in format +639XXXXXXXXX" });
    }

    // Validate password strength
    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Validate location
    if (!location) {
        return res.status(400).json({ error: "Location is required" });
    }

    try {
        // Check if email already exists
        const existingUser = await db.get(
            'SELECT emailAddress FROM blnbtghog_owners WHERE emailAddress = ?',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const fullName = `${firstName} ${lastName}`;
        const userCreated = new Date().toISOString();

        const newUser = {
            uid: userId,
            fullName,
            emailAddress: email,
            password: hashedPassword,
            contactNumber: phone,
            userCreated,
            role,
            validIdType,
            validIdUrl,
            verificationToken,
            verificationTokenExpiry,
            location,
            latitude: latitude || null,
            longitude: longitude || null
        };

        await db.run(
            `INSERT INTO blnbtghog_owners (
                uid, fullName, emailAddress, password, contactNumber, 
                userCreated, role, validIdType, validIdUrl,
                verificationToken, verificationTokenExpiry,
                location, latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newUser.uid, newUser.fullName, newUser.emailAddress, newUser.password,
                newUser.contactNumber, newUser.userCreated, newUser.role,
                newUser.validIdType, newUser.validIdUrl, newUser.verificationToken,
                newUser.verificationTokenExpiry, newUser.location,
                newUser.latitude, newUser.longitude
            ]
        );

        // Log the registration
        await logAudit('blnbtghog_owners', userId, 'INSERT', null, newUser, null);

        res.status(201).json({
            message: "Registration successful. Please check your email for verification.",
            verificationToken
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Registration failed. Please try again later." });
    }
});

// Get current user profile
app.get("/profile", authenticateToken, async (req, res) => {
    try {
        const user = await db.get(`SELECT uid, fullName, emailAddress, contactNumber, userCreated, profilePicture, role, status FROM blnbtghog_owners WHERE uid = ?`, [req.user.uid]);
        if (!user) return res.status(404).json({ error: "User not found" });
        // Split fullName for frontend compatibility
        let firstName = '', lastName = '';
        if (user.fullName) {
            const parts = user.fullName.trim().split(' ');
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
        }
        res.json({
            ...user,
            firstName,
            lastName
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve profile" });
    }
});

// Update current user profile
app.put("/profile", authenticateToken, async (req, res) => {
    const { fullName, emailAddress, contactNumber, profilePicture } = req.body;
    if (!fullName && !emailAddress && !contactNumber && !profilePicture) {
        return res.status(400).json({ error: "No fields provided to update" });
    }
    try {
        // Only update provided fields
        const user = await db.get(`SELECT * FROM blnbtghog_owners WHERE uid = ?`, [req.user.uid]);
        if (!user) return res.status(404).json({ error: "User not found" });
        const updatedFullName = fullName || user.fullName;
        const updatedEmail = emailAddress || user.emailAddress;
        const updatedPhone = contactNumber || user.contactNumber;
        const updatedProfilePicture = profilePicture || user.profilePicture;
        await db.run(
            `UPDATE blnbtghog_owners SET fullName = ?, emailAddress = ?, contactNumber = ?, profilePicture = ? WHERE uid = ?`,
            [updatedFullName, updatedEmail, updatedPhone, updatedProfilePicture, req.user.uid]
        );
        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// List all accounts (admin/employee only) - now includes status/location
app.get("/accounts", authenticateToken, async (req, res) => {
    try {
        // Only return user (hog raiser) accounts, not employees
        const accounts = await db.all(`SELECT uid, fullName, emailAddress, contactNumber, userCreated, role, status, location, latitude, longitude FROM blnbtghog_owners WHERE LOWER(role) = 'user'`);
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve accounts" });
    }
});

// Get all pending hog owner accounts (for employee dashboard verification)
app.get("/pending-accounts", authenticateToken, async (req, res) => {
    try {
        // Only return pending user (hog raiser) accounts, not employees
        const pending = await db.all(`SELECT uid, fullName, emailAddress, contactNumber, userCreated, role, status, location, latitude, longitude FROM blnbtghog_owners WHERE LOWER(role) = 'user' AND LOWER(status) = 'pending'`);
        res.json(pending);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve pending accounts" });
    }
});

// Update account status (accept/reject)
app.put("/accounts/:uid/status", authenticateToken, async (req, res) => {
    const { uid } = req.params;
    const { status } = req.body;
    if (!['pending', 'verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }
    try {
        await db.run(`UPDATE blnbtghog_owners SET status = ? WHERE uid = ?`, [status, uid]);
        res.json({ message: `Account status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ error: "Failed to update account status" });
    }
});

// Add Farm endpoint
app.post("/farms", authenticateToken, async (req, res) => {
    console.log("Received farm data:", req.body);
    const { branchName, address, city, province, pigCount, farmSize, farmType, hogs } = req.body;
    
    // Validate required fields
    const requiredFields = { branchName, address, city, province, pigCount, farmSize, farmType };
    const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
    
    if (missingFields.length > 0) {
        console.log("Missing required fields:", missingFields);
        return res.status(400).json({ 
            error: "Missing required fields", 
            missingFields 
        });
    }

    try {
        const id = uuidv4();
        const createdAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        
        // Insert farm
        await db.run(
            `INSERT INTO farms (id, ownerUid, branchName, address, city, province, pigCount, farmSize, farmType, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.user.uid, branchName, address, city, province, pigCount, farmSize, farmType, createdAt]
        );

        // Insert hogs if provided
        if (hogs && Array.isArray(hogs)) {
            console.log("Processing hogs:", hogs.length);
            for (const hog of hogs) {
                const hogId = uuidv4();
                await db.run(
                    `INSERT INTO hogs (id, farmId, breed, gender, birthday, photos, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [hogId, id, hog.breed, hog.gender, hog.birthday, JSON.stringify(hog.photos), createdAt]
                );
            }
        }

        res.status(201).json({ 
            message: "Farm added successfully",
            farmId: id
        });
    } catch (error) {
        console.error("Add farm error:", error);
        res.status(500).json({ 
            error: "Failed to add farm",
            details: error.message 
        });
    }
});

// Endpoint to get all ASF outbreak reports (optionally filter by user/scope)
app.get("/asf-outbreak-reports", authenticateToken, async (req, res) => {
    try {
        // For now, return all reports. Filter by user/scope if needed.
        const reports = await db.all(`SELECT * FROM asf_outbreak_reports`);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve ASF outbreak reports" });
    }
});

// Endpoint to add a new ASF outbreak report
app.post("/asf-outbreak-reports", authenticateToken, async (req, res) => {
    const { dateReported, barangay, municipality, province, description, status } = req.body;
    if (!dateReported || !barangay || !municipality || !province || !description || !status) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        const id = uuidv4();
        const createdAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        await db.run(
            `INSERT INTO asf_outbreak_reports (id, dateReported, barangay, municipality, province, reportedByUid, description, status, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, dateReported, barangay, municipality, province, req.user.uid, description, status, createdAt]
        );
        res.status(201).json({ message: "ASF outbreak report added successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to add ASF outbreak report" });
    }
});

// Update dashboard-data endpoint to return farms, news, and accountInfo
app.get("/dashboard-data", authenticateToken, async (req, res) => {
    try {
        // Get account info
        const user = await db.get(`SELECT uid, fullName, emailAddress, contactNumber, userCreated FROM blnbtghog_owners WHERE uid = ?`, [req.user.uid]);
        // Get farms for user
        let farms = await db.all(`SELECT * FROM farms WHERE ownerUid = ?`, [req.user.uid]);
        // Add computed fields for frontend compatibility
        farms = farms.map(farm => ({
            ...farm,
            name: farm.branchName,
            location: `${farm.address}, ${farm.city}, ${farm.province}`
        }));
        // Get news (stubbed for now)
        const news = [
            { id: 1, title: "ASF Alert", content: "African Swine Fever detected in nearby barangays.", date: "2025-04-25" },
            { id: 2, title: "Vaccination Drive", content: "Free hog vaccination this May.", date: "2025-05-01" }
        ];
        // Get ASF outbreak reports count
        const asfOutbreakCount = await db.get(`SELECT COUNT(*) as count FROM asf_outbreak_reports`);
        // Compose account info
        const accountInfo = {
            status: "Active",
            memberSince: user.userCreated,
            totalFarms: farms.length,
            totalPigs: farms.reduce((sum, f) => sum + (f.pigCount || 0), 0),
            totalHogs: farms.reduce((sum, f) => sum + (f.pigCount || 0), 0),
            nextInspection: "2025-12-31", // Example static value, update logic as needed
            accountType: "Hog Owner" // Example static value, update logic as needed
        };
        res.json({ accountInfo, farms, news, asfOutbreakCount: asfOutbreakCount.count });
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve dashboard data" });
    }
});

// Dashboard data endpoint (stub)
// app.get("/dashboard-data", authenticateToken, async (req, res) => {
//     // Replace with real stats as needed
//     try {
//         const totalUsers = await db.get(`SELECT COUNT(*) as count FROM blnbtghog_owners`);
//         res.json({ totalUsers: totalUsers.count, news: [] });
//     } catch (err) {
//         res.status(500).json({ error: "Failed to retrieve dashboard data" });
//     }
// });

// Check DB connection
app.get("/", async (req, res) => {
    try {
        const now = new Date().toLocaleString();
        res.json({ message: "SQLite Connected", time: now });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
});

// Add this new endpoint for validating Balayan locations
app.post("/validate-location", async (req, res) => {
    const { location, latitude, longitude } = req.body;
    
    try {
        // If coordinates are provided, validate them
        if (latitude && longitude) {
            // Balayan's approximate boundaries (expanded for better coverage)
            const isInBalayan = (
                latitude >= 13.8800 && latitude <= 13.9700 && // Expanded latitude range
                longitude >= 120.6800 && longitude <= 120.7800 // Expanded longitude range
            );
            
            if (!isInBalayan) {
                // Additional validation using reverse geocoding
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    const data = await response.json();
                    
                    if (data.address) {
                        const city = (data.address.city || "").toLowerCase();
                        const municipality = (data.address.municipality || "").toLowerCase();
                        const county = (data.address.county || "").toLowerCase();
                        const state = (data.address.state || "").toLowerCase();
                        
                        const isBalayan = 
                            city.includes("balayan") || 
                            municipality.includes("balayan") || 
                            county.includes("balayan");
                        
                        const isBatangas = state.includes("batangas");
                        
                        if (!isBalayan || !isBatangas) {
                            return res.status(400).json({ 
                                error: "Location must be within Balayan, Batangas",
                                suggestedLocations: [
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
                                ]
                            });
                        }
                    }
                } catch (geocodingError) {
                    console.error("Geocoding error:", geocodingError);
                    return res.status(400).json({ 
                        error: "Location must be within Balayan, Batangas",
                        suggestedLocations: [
                            "Brgy. Caloocan, Balayan, Batangas",
                            "Brgy. Canda, Balayan, Batangas",
                            "Brgy. Lucban, Balayan, Batangas",
                            "Brgy. Gumamela, Balayan, Batangas",
                            "Brgy. Poblacion, Balayan, Batangas"
                        ]
                    });
                }
            }
        }
        
        // If location text is provided, validate it
        if (location) {
            const locationLower = location.toLowerCase();
            const isBalayan = locationLower.includes("balayan") && locationLower.includes("batangas");
            
            if (!isBalayan) {
                return res.status(400).json({ 
                    error: "Location must be within Balayan, Batangas",
                    suggestedLocations: [
                        "Brgy. Caloocan, Balayan, Batangas",
                        "Brgy. Canda, Balayan, Batangas",
                        "Brgy. Lucban, Balayan, Batangas",
                        "Brgy. Gumamela, Balayan, Batangas",
                        "Brgy. Poblacion, Balayan, Batangas"
                    ]
                });
            }
        }
        
        res.json({ 
            message: "Location validated successfully",
            isBalayan: true
        });
    } catch (err) {
        console.error("Location validation error:", err);
        res.status(500).json({ error: "Failed to validate location" });
    }
});

// Rate limiting middleware for password changes
const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many password change attempts. Please try again later.' }
});

// Password change endpoint
app.put("/accounts/:uid/changePassword", authenticateToken, passwordChangeLimiter, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { uid } = req.params;

    try {
        // Verify user exists
        const user = await db.get(`SELECT * FROM blnbtghog_owners WHERE uid = ?`, [uid]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        if (!/[0-9]/.test(newPassword)) {
            return res.status(400).json({ error: "Password must contain at least one number" });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run(`UPDATE blnbtghog_owners SET password = ? WHERE uid = ?`, [hashedPassword, uid]);

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Password update error:", err);
        res.status(500).json({ error: "Failed to update password" });
    }
});

// Delete account endpoint
app.delete("/accounts/:uid", authenticateToken, async (req, res) => {
    const { uid } = req.params;
    
    // Verify the user is deleting their own account
    if (req.user.uid !== uid) {
        return res.status(403).json({ error: "You can only delete your own account" });
    }

    try {
        // Start a transaction to ensure all deletions are atomic
        await db.run('BEGIN TRANSACTION');

        try {
            // Delete associated farms
            await db.run('DELETE FROM farms WHERE ownerUid = ?', [uid]);
            console.log(`Deleted farms for user ${uid}`);
        } catch (err) {
            console.warn("Error deleting farms:", err);
            // Continue with deletion even if farms table doesn't exist
        }
        
        try {
            // Delete associated notifications
            await db.run('DELETE FROM notifications WHERE userId = ?', [uid]);
            console.log(`Deleted notifications for user ${uid}`);
        } catch (err) {
            console.warn("Error deleting notifications:", err);
            // Continue with deletion even if notifications table doesn't exist
        }
        
        // Delete the user account
        const result = await db.run('DELETE FROM blnbtghog_owners WHERE uid = ?', [uid]);
        console.log(`Deleted user account ${uid}, rows affected: ${result.changes}`);

        if (result.changes === 0) {
            throw new Error("User account not found");
        }

        // Commit the transaction
        await db.run('COMMIT');
        console.log(`Successfully deleted account ${uid}`);

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        // Rollback in case of error
        await db.run('ROLLBACK');
        console.error("Account deletion error:", err);
        res.status(500).json({ 
            error: "Failed to delete account",
            details: err.message 
        });
    }
});

// Get complete hog owner details including farm and hog information
app.get("/hog-owner/:uid", authenticateToken, async (req, res) => {
    try {
        console.log(`Fetching details for hog owner: ${req.params.uid}`);
        
        // Get owner details
        const owner = await db.get(
            `SELECT uid, fullName, emailAddress, contactNumber, userCreated, role, status, location, latitude, longitude, validIdType, validIdUrl 
             FROM blnbtghog_owners 
             WHERE uid = ?`,
            [req.params.uid]
        );

        if (!owner) {
            console.log(`No owner found with uid: ${req.params.uid}`);
            return res.status(404).json({ error: "Hog owner not found" });
        }

        console.log(`Found owner: ${owner.fullName}`);

        // Ensure validIdUrl is properly formatted
        if (owner.validIdUrl) {
            // If it's a relative path, make it absolute
            if (owner.validIdUrl.startsWith('/')) {
                owner.validIdUrl = `${req.protocol}://${req.get('host')}${owner.validIdUrl}`;
            }
        }

        // Get farm details
        const farms = await db.all(
            `SELECT * FROM farms WHERE ownerUid = ?`,
            [req.params.uid]
        );

        console.log(`Found ${farms.length} farms for owner`);

        // Get hogs for each farm
        for (let farm of farms) {
            const hogs = await db.all(
                `SELECT * FROM hogs WHERE farmId = ?`,
                [farm.id]
            );
            farm.hogs = hogs.map(hog => ({
                ...hog,
                photos: JSON.parse(hog.photos || '[]')
            }));
            console.log(`Found ${hogs.length} hogs for farm ${farm.id}`);
        }

        // Combine all data
        const ownerDetails = {
            ...owner,
            farms: farms.map(farm => ({
                ...farm,
                name: farm.branchName,
                location: `${farm.address}, ${farm.city}, ${farm.province}`
            }))
        };

        console.log('Successfully compiled owner details');
        res.json(ownerDetails);
    } catch (err) {
        console.error("Error fetching hog owner details:", err);
        res.status(500).json({ 
            error: "Failed to retrieve hog owner details",
            details: err.message 
        });
    }
});

// Notification API endpoints

// Create a new notification (POST /api/notifications)
app.post("/api/notifications", authenticateToken, async (req, res) => {
    const { title, message, type, targetUsers } = req.body;
    if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
    }
    try {
        // If targetUsers is provided, create notification for specific users
        // Otherwise, create for all users
        let users = [];
        if (targetUsers && Array.isArray(targetUsers)) {
            users = targetUsers;
        } else {
            // Get all active users
            const allUsers = await db.all(
                `SELECT uid FROM blnbtghog_owners WHERE isActive = true`
            );
            users = allUsers.map(user => user.uid);
        }

        console.log(`Creating notifications for ${users.length} users`);

        // Create notification for each user
        const notifications = [];
        for (const userId of users) {
            const id = uuidv4();
            await db.run(
                `INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
                 VALUES (?, ?, ?, ?, ?, false, CURRENT_TIMESTAMP)`,
                [id, userId, title, message, type || 'info']
            );
            notifications.push({
                id,
                userId,
                title,
                message,
                type: type || 'info',
                isRead: false,
                createdAt: new Date().toISOString()
            });
        }

        console.log(`Successfully created ${notifications.length} notifications`);
        res.status(201).json(notifications);
    } catch (err) {
        console.error("Error creating notifications:", err);
        res.status(500).json({ error: "Failed to create notifications" });
    }
});

// Fetch notifications (GET /api/notifications)
app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
        console.log(`Fetching notifications for user ${req.user.uid}`);
        // Only fetch notifications for the current user
        const notifications = await db.all(
            `SELECT * FROM notifications 
             WHERE userId = ? 
             ORDER BY createdAt DESC`,
            [req.user.uid]
        );
        console.log(`Found ${notifications.length} notifications for user ${req.user.uid}`);
        res.json(notifications);
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// Get unread notification count (GET /api/notifications/unread/count)
app.get("/api/notifications/unread/count", authenticateToken, async (req, res) => {
    try {
        console.log(`Getting unread count for user ${req.user.uid}`);
        const result = await db.get(
            `SELECT COUNT(*) as count 
             FROM notifications 
             WHERE userId = ? AND isRead = false`,
            [req.user.uid]
        );
        console.log(`User ${req.user.uid} has ${result.count} unread notifications`);
        res.json({ count: result.count });
    } catch (err) {
        console.error("Error getting unread count:", err);
        res.status(500).json({ error: "Failed to get unread count" });
    }
});

// Mark notification as read (PUT /api/notifications/:id/read)
app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`Marking notification ${id} as read for user ${req.user.uid}`);
        // Only mark as read for the current user
        const result = await db.run(
            `UPDATE notifications 
             SET isRead = true 
             WHERE id = ? AND userId = ?`,
            [id, req.user.uid]
        );
        console.log(`Updated ${result.changes} notifications`);
        res.json({ message: "Notification marked as read" });
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

// Delete notification (DELETE /api/notifications/:id)
app.delete("/api/notifications/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`Deleting notification ${id} for user ${req.user.uid}`);
        // Only delete for the current user
        const result = await db.run(
            `DELETE FROM notifications 
             WHERE id = ? AND userId = ?`,
            [id, req.user.uid]
        );
        console.log(`Deleted ${result.changes} notifications`);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Notification not found or not authorized" });
        }
        res.json({ message: "Notification deleted" });
    } catch (err) {
        console.error("Error deleting notification:", err);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});

// Get verified hog owners' locations
app.get('/api/verified-hog-owners', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching verified hog owners...');
        const owners = await db.all(`
            SELECT 
                ho.uid,
                ho.fullName as name,
                ho.location as address,
                ho.latitude,
                ho.longitude,
                ho.status
            FROM blnbtghog_owners ho
            WHERE ho.status = 'verified'
            AND ho.latitude IS NOT NULL 
            AND ho.longitude IS NOT NULL
        `);
        
        console.log(`Found ${owners.length} verified hog owners`);
        res.json(owners);
    } catch (error) {
        console.error('Error fetching verified hog owners:', error);
        res.status(500).json({ error: 'Failed to fetch verified hog owners' });
    }
});

async function startServer() {
    try {
        await initDB();
        console.log("✅ SQLite database initialized");

        app.listen(3000, () => {
            console.log(`🚀 Server running at http://localhost:3000`);
        });
    } catch (error) {
        console.error("❌ Failed to initialize database:", error.message);
    }
}

startServer();