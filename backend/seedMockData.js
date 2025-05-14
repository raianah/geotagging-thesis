import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

async function seed() {
    const db = await open({
        filename: './temp.db',
        driver: sqlite3.Database
    });

    // Create table with all required columns for backend/frontend
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

    // Add any missing columns for backward compatibility
    const columnsToAdd = [
        { name: 'role', type: 'TEXT' },
        { name: 'status', type: "TEXT DEFAULT 'pending'" },
        { name: 'location', type: 'TEXT' },
        { name: 'latitude', type: 'REAL' },
        { name: 'longitude', type: 'REAL' }
    ];
    for (const col of columnsToAdd) {
        try {
            await db.exec(`ALTER TABLE blnbtghog_owners ADD COLUMN ${col.name} ${col.type};`);
        } catch (err) {
            if (!String(err).includes('duplicate column name') && !String(err).includes('duplicate column')) {
                throw err;
            }
        }
    }

    // Remove all existing data for a clean seed
    await db.run('DELETE FROM blnbtghog_owners');

    // Seed employees (no location, no status field)
    const employees = [
        {
            uid: uuidv4(),
            fullName: 'Juan Dela Cruz',
            emailAddress: 'juan.employee@balayan.gov.ph',
            password: await bcrypt.hash('password123', 10),
            contactNumber: '09171234567',
            userCreated: new Date('2025-04-01T09:00:00+08:00').toISOString(),
            profilePicture: null,
            role: 'employee',
            location: null,
            latitude: null,
            longitude: null
        },
        {
            uid: uuidv4(),
            fullName: 'Maria Santos',
            emailAddress: 'maria.santos@balayan.gov.ph',
            password: await bcrypt.hash('password123', 10),
            contactNumber: '09181234567',
            userCreated: new Date('2025-04-02T10:30:00+08:00').toISOString(),
            profilePicture: null,
            role: 'employee',
            location: null,
            latitude: null,
            longitude: null
        }
    ];

    // Seed hog owners (with location and status)
    const hogOwners = [
        {
            uid: uuidv4(),
            fullName: 'Pedro Ramos',
            emailAddress: 'pedro.ramos@gmail.com',
            password: await bcrypt.hash('hogowner1', 10),
            contactNumber: '09190001111',
            userCreated: new Date('2025-04-10T08:00:00+08:00').toISOString(),
            profilePicture: null,
            role: 'user',
            status: 'pending',
            location: 'Brgy. Caloocan, Balayan, Batangas',
            latitude: 13.9335,
            longitude: 120.7320
        },
        {
            uid: uuidv4(),
            fullName: 'Luzviminda Cruz',
            emailAddress: 'luz.cruz@gmail.com',
            password: await bcrypt.hash('hogowner2', 10),
            contactNumber: '09190002222',
            userCreated: new Date('2025-04-12T14:30:00+08:00').toISOString(),
            profilePicture: null,
            role: 'user',
            status: 'verified',
            location: 'Brgy. Canda, Balayan, Batangas',
            latitude: 13.9380,
            longitude: 120.7400
        },
        {
            uid: uuidv4(),
            fullName: 'Ramon Garcia',
            emailAddress: 'ramon.garcia@gmail.com',
            password: await bcrypt.hash('hogowner3', 10),
            contactNumber: '09190003333',
            userCreated: new Date('2025-04-13T10:15:00+08:00').toISOString(),
            profilePicture: null,
            role: 'user',
            status: 'verified',
            location: 'Brgy. Lucban, Balayan, Batangas',
            latitude: 13.9400,
            longitude: 120.7285
        },
        {
            uid: uuidv4(),
            fullName: 'Josefina Dela Rosa',
            emailAddress: 'josefina.rosa@gmail.com',
            password: await bcrypt.hash('hogowner4', 10),
            contactNumber: '09190004444',
            userCreated: new Date('2025-04-15T16:45:00+08:00').toISOString(),
            profilePicture: null,
            role: 'user',
            status: 'pending',
            location: 'Brgy. Gumamela, Balayan, Batangas',
            latitude: 13.9412,
            longitude: 120.7350
        }
    ];

    // Insert all accounts
    for (const emp of employees) {
        await db.run(
            `INSERT INTO blnbtghog_owners (uid, fullName, emailAddress, password, contactNumber, userCreated, profilePicture, role, status, location, latitude, longitude)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [emp.uid, emp.fullName, emp.emailAddress, emp.password, emp.contactNumber, emp.userCreated, emp.profilePicture, emp.role, 'verified', emp.location, emp.latitude, emp.longitude]
        );
    }
    for (const owner of hogOwners) {
        await db.run(
            `INSERT INTO blnbtghog_owners (uid, fullName, emailAddress, password, contactNumber, userCreated, profilePicture, role, status, location, latitude, longitude)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [owner.uid, owner.fullName, owner.emailAddress, owner.password, owner.contactNumber, owner.userCreated, owner.profilePicture, owner.role, owner.status, owner.location, owner.latitude, owner.longitude]
        );
    }

    console.log('Mock data seeded successfully!');
    await db.close();
}

seed().catch(console.error);
