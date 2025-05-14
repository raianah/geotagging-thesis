import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pool from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateData() {
    // Connect to SQLite database
    const sqliteDb = await open({
        filename: './temp.db',
        driver: sqlite3.Database
    });

    const pgClient = await pool.connect();

    try {
        // Start PostgreSQL transaction
        await pgClient.query('BEGIN');

        // Migrate users
        console.log('Migrating users...');
        const users = await sqliteDb.all('SELECT * FROM blnbtghog_owners');
        for (const user of users) {
            await pgClient.query(
                'INSERT INTO blnbtghog_owners (uid, fullName, emailAddress, password, contactNumber, userCreated, profilePicture, role, status, location, latitude, longitude, validIdType, validIdUrl, lastLogin, isActive, verificationToken, verificationTokenExpiry, resetPasswordToken, resetPasswordExpiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)',
                [
                    user.uid,
                    user.fullName,
                    user.emailAddress,
                    user.password,
                    user.contactNumber,
                    user.userCreated,
                    user.profilePicture,
                    user.role,
                    user.status,
                    user.location,
                    user.latitude,
                    user.longitude,
                    user.validIdType,
                    user.validIdUrl,
                    user.lastLogin,
                    user.isActive,
                    user.verificationToken,
                    user.verificationTokenExpiry,
                    user.resetPasswordToken,
                    user.resetPasswordExpiry
                ]
            );
        }

        // Migrate farms
        console.log('Migrating farms...');
        const farms = await sqliteDb.all('SELECT * FROM farms');
        for (const farm of farms) {
            await pgClient.query(
                'INSERT INTO farms (id, ownerUid, branchName, address, city, province, pigCount, farmSize, farmType, createdAt, updatedAt, status, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
                [
                    farm.id,
                    farm.ownerUid,
                    farm.branchName,
                    farm.address,
                    farm.city,
                    farm.province,
                    farm.pigCount,
                    farm.farmSize,
                    farm.farmType,
                    farm.createdAt,
                    farm.updatedAt,
                    farm.status,
                    farm.latitude,
                    farm.longitude
                ]
            );
        }

        // Migrate ASF outbreak reports
        console.log('Migrating ASF outbreak reports...');
        const reports = await sqliteDb.all('SELECT * FROM asf_outbreak_reports');
        for (const report of reports) {
            await pgClient.query(
                'INSERT INTO asf_outbreak_reports (id, dateReported, barangay, municipality, province, reportedByUid, description, status, createdAt, updatedAt, latitude, longitude, severity, affectedPigCount, isVerified, verifiedByUid, verificationDate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
                [
                    report.id,
                    report.dateReported,
                    report.barangay,
                    report.municipality,
                    report.province,
                    report.reportedByUid,
                    report.description,
                    report.status,
                    report.createdAt,
                    report.updatedAt,
                    report.latitude,
                    report.longitude,
                    report.severity,
                    report.affectedPigCount,
                    report.isVerified,
                    report.verifiedByUid,
                    report.verificationDate
                ]
            );
        }

        // Migrate hogs
        console.log('Migrating hogs...');
        const hogs = await sqliteDb.all('SELECT * FROM hogs');
        for (const hog of hogs) {
            await pgClient.query(
                'INSERT INTO hogs (id, farmId, breed, gender, birthday, photos, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [
                    hog.id,
                    hog.farmId,
                    hog.breed,
                    hog.gender,
                    hog.birthday,
                    hog.photos,
                    hog.createdAt
                ]
            );
        }

        // Migrate audit logs
        console.log('Migrating audit logs...');
        const logs = await sqliteDb.all('SELECT * FROM audit_logs');
        for (const log of logs) {
            await pgClient.query(
                'INSERT INTO audit_logs (id, tableName, recordId, action, oldData, newData, userId, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [
                    log.id,
                    log.tableName,
                    log.recordId,
                    log.action,
                    log.oldData,
                    log.newData,
                    log.userId,
                    log.timestamp
                ]
            );
        }

        // Commit the transaction
        await pgClient.query('COMMIT');
        console.log('Data migration completed successfully');

    } catch (error) {
        // Rollback in case of error
        await pgClient.query('ROLLBACK');
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        // Close connections
        await sqliteDb.close();
        pgClient.release();
        await pool.end();
    }
}

migrateData(); 