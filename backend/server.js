import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const RETRY_INTERVAL = 5000;

app.post("/login", async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

	try {
		const result = await pool.query(`SELECT * FROM blnbtghog_owners WHERE "emailAddress" = $1`, [email]);
		if (result.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

		const user = result.rows[0];
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

		res.status(200).json({ message: "Login successful" });
	} catch (error) {
		console.error("Database error:", error);
		res.status(500).json({ error: "Database error" });
	}
});

app.post("/register", async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;

    console.log("Registering user:", req.body);

    if (!firstName || !lastName || !email || !password || !phone) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // hashing the password
        const userId = uuidv4(); // generating unique user id (duplication protection)
        const fullName = `${firstName} ${lastName}`;

        const result = await pool.query(
            `INSERT INTO blnbtghog_owners ("uid", "fullName", "emailAddress", "password", "contactNumber", "userCreated") 
             VALUES ($1, $2, $3, $4, $5, NOW() AT TIME ZONE 'Asia/Manila') RETURNING *`,
            [userId, fullName, email, hashedPassword, phone]
        );

        res.status(201).json({ message: "Registration successful", user: result.rows[0] });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// database connection (demonstration purposes only)
app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "Database Connected", time: result.rows[0].now });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database Connection Failed" });
    }
});

async function startServer() {
    try {
        await pool.query("SELECT NOW()");
        console.log("✅ Database connected successfully.");

        app.listen(3000, () => {
            console.log(`🚀 Server running at http://localhost:3000.`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to the database:", error.message);
        console.log(`🔄 Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
        setTimeout(startServer, RETRY_INTERVAL);
    }
}

startServer();