import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./authMiddleware.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

let db;

// Initialize SQLite DB
async function initDB() {
    db = await open({
        filename: './temp.db',
        driver: sqlite3.Database
    });

    // Create table if not exists (temporary use)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS blnbtghog_owners (
            uid TEXT PRIMARY KEY,
            fullName TEXT,
            emailAddress TEXT UNIQUE,
            password TEXT,
            contactNumber TEXT,
            userCreated TEXT,
            profilePicture TEXT,
            role TEXT,
            status TEXT DEFAULT 'pending',
            location TEXT,
            latitude REAL,
            longitude REAL
        );
    `);

    // Create farms table if not exists
    await db.exec(`
        CREATE TABLE IF NOT EXISTS farms (
            id TEXT PRIMARY KEY,
            ownerUid TEXT,
            branchName TEXT,
            address TEXT,
            city TEXT,
            province TEXT,
            pigCount INTEGER,
            farmSize REAL,
            farmType TEXT,
            createdAt TEXT,
            FOREIGN KEY(ownerUid) REFERENCES blnbtghog_owners(uid)
        );
    `);

    // Add ASF Outbreak Reports table if not exists
    await db.exec(`
        CREATE TABLE IF NOT EXISTS asf_outbreak_reports (
            id TEXT PRIMARY KEY,
            dateReported TEXT,
            barangay TEXT,
            municipality TEXT,
            province TEXT,
            reportedByUid TEXT,
            description TEXT,
            status TEXT,
            createdAt TEXT,
            FOREIGN KEY(reportedByUid) REFERENCES blnbtghog_owners(uid)
        );
    `);
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
    const { firstName, lastName, email, password, phone, role } = req.body;

    if (!firstName || !lastName || !email || !password || !phone || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const fullName = `${firstName} ${lastName}`;
        const userCreated = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

        await db.run(
            `INSERT INTO blnbtghog_owners (uid, fullName, emailAddress, password, contactNumber, userCreated, role)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, fullName, email, hashedPassword, phone, userCreated, role]
        );

        res.status(201).json({ message: "Registration successful" });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Registration failed" });
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
    const { branchName, address, city, province, pigCount, farmSize, farmType } = req.body;
    if (!branchName || !address || !city || !province || !pigCount || !farmSize || !farmType) {
        return res.status(400).json({ error: "All farm fields are required" });
    }
    try {
        const id = uuidv4();
        const createdAt = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        await db.run(
            `INSERT INTO farms (id, ownerUid, branchName, address, city, province, pigCount, farmSize, farmType, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.user.uid, branchName, address, city, province, pigCount, farmSize, farmType, createdAt]
        );
        res.status(201).json({ message: "Farm added successfully" });
    } catch (error) {
        console.error("Add farm error:", error);
        res.status(500).json({ error: "Failed to add farm" });
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