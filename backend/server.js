import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./authMiddleware.js";
import crypto from "crypto";
import fetch from "node-fetch";
import rateLimit from 'express-rate-limit';
import pool from './config/database.js';

dotenv.config();

const app = express();

// Configure CORS with more specific options (Development)
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://localhost:4493'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Production
// const corsOptions = {
//     origin: ['https://balayanhog2025.thetwlight.xyz', 'http://dono-03.danbot.host:4493'],
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//     maxAge: 86400 // 24 hours
// };

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
    const allowedOrigins = [
        'http://dono-03.danbot.host:4493',
        'https://balayanhog2025.thetwlight.xyz',
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
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

// Audit logging function
async function logAudit(tableName, recordId, action, oldData, newData, userId) {
    try {
        await pool.query(
            'INSERT INTO audit_logs (id, tableName, recordId, action, oldData, newData, "userId" ) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [uuidv4(), tableName, recordId, action, JSON.stringify(oldData), JSON.stringify(newData), "userId" ]
        );
    } catch (error) {
        console.error('Error logging audit:', error);
    }
}

// Login route
app.post("/login", async (req, res) => {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        console.log('Querying user with email:', email);
        const { rows: users } = await pool.query(
            'SELECT * FROM blnbtghog_owners WHERE "emailAddress" = $1',
            [email]
        );
        console.log('Query result:', users);

        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = users[0];

        console.time('bcrypt.compare');
        const isMatch = await bcrypt.compare(password, user.password);
        console.timeEnd('bcrypt.compare');

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate access token (15 minutes)
        const accessToken = jwt.sign(
            { uid: user.uid },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '15m' }
        );

        // Generate refresh token (7 days)
        const refreshToken = jwt.sign(
            { uid: user.uid },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            { expiresIn: '7d' }
        );

        // Store refresh token in database
        await pool.query(
            'UPDATE blnbtghog_owners SET refresh_token = $1 WHERE uid = $2',
            [refreshToken, user.uid]
        );

        console.log('Login successful for user:', user.uid);
        res.status(200).json({
            message: "Login successful",
            user: {
                uid: user.uid,
                fullName: user.fullName,
                emailAddress: user.emailAddress,
            },
            accessToken,
            refreshToken
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
        const { rows: existingUsers } = await pool.query(
            'SELECT "emailAddress" FROM blnbtghog_owners WHERE emailAddress = $1',
            [email]
        );

        if (existingUsers.length > 0) {
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

        await pool.query(
            'INSERT INTO blnbtghog_owners (uid, "fullName", "emailAddress", password, "contactNumber", "userCreated", role, "validIdType", "validIdUrl", "verificationToken", "verificationTokenExpiry", location, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
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
        const { rows: users } = await pool.query(
            'SELECT uid, "fullName", "emailAddress", "contactNumber", "userCreated", "profilePicture", role, status FROM blnbtghog_owners WHERE uid = $1',
            [req.user.uid]
        );
        if (users.length === 0) return res.status(404).json({ error: "User not found" });
        const user = users[0];
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
        console.log(err);
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
        const { rows: users } = await pool.query(
            'SELECT * FROM blnbtghog_owners WHERE uid = $1',
            [req.user.uid]
        );
        if (users.length === 0) return res.status(404).json({ error: "User not found" });
        const user = users[0];
        const updatedFullName = fullName || user.fullName;
        const updatedEmail = emailAddress || user.emailAddress;
        const updatedPhone = contactNumber || user.contactNumber;
        const updatedProfilePicture = profilePicture || user.profilePicture;
        await pool.query(
            'UPDATE blnbtghog_owners SET "fullName" = $1, "emailAddress" = $2, "contactNumber" = $3, "profilePicture" = $4 WHERE uid = $5;',
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
        const { rows: accounts } = await pool.query(
            'SELECT uid, "fullName", "emailAddress", "contactNumber", "userCreated", role, status, location, latitude, longitude FROM blnbtghog_owners WHERE LOWER(role) = $1',
            ['user']
        );
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve accounts" });
    }
});

// Get all pending hog owner accounts (for employee dashboard verification)
app.get("/pending-accounts", authenticateToken, async (req, res) => {
    try {
        // Only return pending user (hog raiser) accounts, not employees
        const { rows: pending } = await pool.query(
            'SELECT uid, "fullName", "emailAddress", "contactNumber", "userCreated", role, status, location, latitude, longitude FROM blnbtghog_owners WHERE LOWER(role) = $1 AND LOWER(status) = $2',
            ['user', 'pending']
        );
        res.json(pending);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve pending accounts" });
    }
});

// Get all rejected hog owner accounts
app.get("/rejected-accounts", authenticateToken, async (req, res) => {
    try {
        // Only return rejected user (hog raiser) accounts, not employees
        const { rows: rejected } = await pool.query(
            'SELECT uid, "fullName", "emailAddress", "contactNumber", "userCreated", role, status, location, latitude, longitude, "rejectionReason" FROM blnbtghog_owners WHERE LOWER(role) = $1 AND LOWER(status) = $2',
            ['user', 'rejected']
        );
        res.json(rejected);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve rejected accounts" });
    }
});

// Update account status (accept/reject)
app.put("/accounts/:uid/status", authenticateToken, async (req, res) => {
    const { uid } = req.params;
    const { status, rejectionReason } = req.body;
    if (!['pending', 'verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }
    try {
        if (status === 'rejected') {
            await pool.query(
                'UPDATE blnbtghog_owners SET status = $1, "rejectionReason" = $2 WHERE uid = $3',
                [status, rejectionReason || null, uid]
            );
        } else {
            await pool.query(
                'UPDATE blnbtghog_owners SET status = $1, "rejectionReason" = NULL WHERE uid = $2',
                [status, uid]
            );
        }
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
        await pool.query(
            'INSERT INTO farms (id, "ownerUid", "branchName", address, city, province, "pigCount", "farmSize", "farmType", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, req.user.uid, branchName, address, city, province, pigCount, farmSize, farmType, createdAt]
        );

        // Insert hogs if provided
        if (hogs && Array.isArray(hogs)) {
            console.log("Processing hogs:", hogs.length);
            for (const hog of hogs) {
                const hogId = uuidv4();
                await pool.query(
                    'INSERT INTO hogs (id, "farmId", breed, gender, birthday, photos, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
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
        const { rows: reports } = await pool.query(
            'SELECT * FROM asf_outbreak_reports'
        );
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
        await pool.query(
            'INSERT INTO asf_outbreak_reports (id, "dateReported", barangay, municipality, province, "reportedByUid", description, status, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
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
        const { rows: users } = await pool.query(
            'SELECT uid, "fullName", "emailAddress", "contactNumber", "userCreated" FROM blnbtghog_owners WHERE uid = $1',
            [req.user.uid]
        );
        const user = users[0];
        // Get farms for user
        const { rows: farms } = await pool.query(
            'SELECT * FROM farms WHERE "ownerUid" = $1',
            [req.user.uid]
        );
        // Add computed fields for frontend compatibility
        const formattedFarms = farms.map(farm => ({
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
        const { rows: asfOutbreakCount } = await pool.query(
            'SELECT COUNT(*) as count FROM asf_outbreak_reports'
        );
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
        res.json({ accountInfo, farms: formattedFarms, news, asfOutbreakCount: asfOutbreakCount[0].count });
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
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "Database Connected", time: result.rows[0].now });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database Connection Failed" });
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
        const { rows: users } = await pool.query(
            'SELECT * FROM blnbtghog_owners WHERE uid = $1',
            [uid]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify current password
        const user = users[0];
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
        await pool.query(
            'UPDATE blnbtghog_owners SET password = $1 WHERE uid = $2',
            [hashedPassword, uid]
        );

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
        await pool.query('BEGIN TRANSACTION');

        try {
            // Delete associated farms
            await pool.query('DELETE FROM farms WHERE "ownerUid" = $1', [uid]);
            console.log(`Deleted farms for user ${uid}`);
        } catch (err) {
            console.warn("Error deleting farms:", err);
            // Continue with deletion even if farms table doesn't exist
        }
        
        try {
            // Delete associated notifications
            await pool.query('DELETE FROM notifications WHERE "userId"  = $1', [uid]);
            console.log(`Deleted notifications for user ${uid}`);
        } catch (err) {
            console.warn("Error deleting notifications:", err);
            // Continue with deletion even if notifications table doesn't exist
        }
        
        // Delete the user account
        const result = await pool.query('DELETE FROM blnbtghog_owners WHERE uid = $1', [uid]);
        console.log(`Deleted user account ${uid}, rows affected: ${result.rowCount}`);

        if (result.rowCount === 0) {
            throw new Error("User account not found");
        }

        // Commit the transaction
        await pool.query('COMMIT');
        console.log(`Successfully deleted account ${uid}`);

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
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
        const { rows: owners } = await pool.query(
            'SELECT uid, "fullName", "emailAddress", "contactNumber", "userCreated", role, status, location, latitude, longitude, "validIdType", "validIdUrl" FROM blnbtghog_owners WHERE uid = $1',
            [req.params.uid]
        );

        if (owners.length === 0) {
            console.log(`No owner found with uid: ${req.params.uid}`);
            return res.status(404).json({ error: "Hog owner not found" });
        }

        console.log(`Found owner: ${owners[0].fullName}`);

        // Ensure validIdUrl is properly formatted
        if (owners[0].validIdUrl) {
            // If it's a relative path, make it absolute
            if (owners[0].validIdUrl.startsWith('/')) {
                owners[0].validIdUrl = `${req.protocol}://${req.get('host')}${owners[0].validIdUrl}`;
            }
        }

        // Get farm details
        const { rows: farms } = await pool.query(
            'SELECT * FROM farms WHERE "ownerUid" = $1',
            [req.params.uid]
        );

        console.log(`Found ${farms.length} farms for owner`);

        // Get hogs for each farm
        for (let farm of farms) {
            const { rows: hogs } = await pool.query(
                'SELECT * FROM hogs WHERE "farmId" = $1',
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
            ...owners[0],
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
app.post("/notifications", authenticateToken, async (req, res) => {
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
            const { rows: allUsers } = await pool.query(
                'SELECT uid FROM blnbtghog_owners WHERE "isActive" = true'
            );
            users = allUsers.map(user => user.uid);
        }

        console.log(`Creating notifications for ${users.length} users`);

        // Create notification for each user
        const notifications = [];
        for (const userId of users) {
            const id = uuidv4();
            await pool.query(
                'INSERT INTO notifications (id, "userId", title, message, type, isRead, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [id, userId, title, message, type || 'info', false, new Date().toISOString()]
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

// Fetch notifications (GET /notifications)
app.get("/notifications", authenticateToken, async (req, res) => {
    try {
        console.log(`Fetching notifications for user ${req.user.uid}`);
        // Only fetch notifications for the current user
        const { rows: notifications } = await pool.query('SELECT * FROM notifications WHERE "userId"  = $1 ORDER BY "createdAt" DESC', [req.user.uid]);
        console.log(`Found ${notifications.length} notifications for user ${req.user.uid}`);
        res.json(notifications);
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// Get unread notification count (GET /notifications/unread/count)
app.get("/notifications/unread/count", authenticateToken, async (req, res) => {
    try {
        console.log(`Getting unread count for user ${req.user.uid}`);
        const { rows: result } = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE "userId"  = $1 AND "isRead" = false', [req.user.uid]);
        console.log(`User ${req.user.uid} has ${result[0].count} unread notifications`);
        res.json({ count: result[0].count });
    } catch (err) {
        console.error("Error getting unread count:", err);
        res.status(500).json({ error: "Failed to get unread count" });
    }
});

// Mark notification as read (PUT /api/notifications/:id/read)
app.put("/notifications/:id/read", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`Marking notification ${id} as read for user ${req.user.uid}`);
        // Only mark as read for the current user
        const result = await pool.query('UPDATE notifications SET "isRead" = true WHERE id = $1 AND "userId"  = $2', [id, req.user.uid]);
        console.log(`Updated ${result.rowCount} notifications`);
        res.json({ message: "Notification marked as read" });
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

// Delete notification (DELETE /api/notifications/:id)
app.delete("/notifications/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`Deleting notification ${id} for user ${req.user.uid}`);
        // Only delete for the current user
        const result = await pool.query('DELETE FROM notifications WHERE id = $1 AND "userId"  = $2', [id, req.user.uid]);
        console.log(`Deleted ${result.rowCount} notifications`);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Notification not found or not authorized" });
        }
        res.json({ message: "Notification deleted" });
    } catch (err) {
        console.error("Error deleting notification:", err);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});

// Get verified hog owners' locations
app.get('/verified-hog-owners', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching verified hog owners...');
        const { rows: owners } = await pool.query(
            'SELECT ho.uid, ho."fullName" as name, ho.latitude, ho.longitude, ho.status FROM blnbtghog_owners ho WHERE ho.status = $1 AND ho.latitude IS NOT NULL AND ho.longitude IS NOT NULL',
            ['verified']
        );
        
        console.log(`Found ${owners.length} verified hog owners`);
        res.json(owners);
    } catch (error) {
        console.error('Error fetching verified hog owners:', error);
        res.status(500).json({ error: 'Failed to fetch verified hog owners' });
    }
});

// ✅ Retry logic variables
const RETRY_INTERVAL = 5000; // 5 seconds

async function startServer() {
    try {
        await pool.query("SELECT NOW()");
        console.log("✅ Database connected successfully.");

        app.listen(26229, () => {
            console.log(`🚀 Server running at http://extreme9i1j.creepercloud.io:26229.`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to the database:", error.message);
        console.log(`🔄 Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
        setTimeout(startServer, RETRY_INTERVAL);
    }
}

startServer();

// Start server
// async function startServer() {
//     try {
//         const port = process.env.PORT || 3001;
//         app.listen(port, () => {
//             console.log(`Server running on port ${port}`);
//         });
//     } catch (error) {
//         console.error('Failed to start server:', error);
//         process.exit(1);
//     }
// }

// startServer();

// Refresh token endpoint
app.post("/refresh-token", async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token is required" });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
        
        // Check if refresh token exists in database
        const { rows } = await pool.query(
            'SELECT * FROM blnbtghog_owners WHERE uid = $1 AND refresh_token = $2',
            [decoded.uid, refreshToken]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { uid: decoded.uid },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '15m' }
        );

        res.json({ accessToken });
    } catch (err) {
        console.error("Refresh token error:", err);
        return res.status(401).json({ error: "Invalid refresh token" });
    }
});