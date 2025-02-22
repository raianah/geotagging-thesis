import express from "express";
import pg from "pg";
import dotenv from "dotenv";

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

app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "Database Connected", time: result.rows[0].now });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database Connection Failed" });
    }
});


app.listen(3000, () => {
    console.log(`Database connected via http://localhost:3000.`);
});