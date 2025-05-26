-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS blnbtghog_owners (
            uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
            CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
        );

CREATE TABLE IF NOT EXISTS farms (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            ownerUid UUID NOT NULL,
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
            CONSTRAINT valid_farm_longitude CHECK (longitude >= -180 AND longitude <= 180)
        );

CREATE TABLE IF NOT EXISTS hogs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            farmId UUID NOT NULL,
            breed VARCHAR(100) NOT NULL,
            gender VARCHAR(10) NOT NULL,
            birthday DATE NOT NULL,
            photos TEXT, -- JSON array of photo URLs/base64
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(farmId) REFERENCES farms(id) ON DELETE CASCADE
        );

CREATE TABLE IF NOT EXISTS asf_outbreak_reports (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            dateReported TIMESTAMP NOT NULL,
            barangay VARCHAR(100) NOT NULL,
            municipality VARCHAR(100) NOT NULL,
            province VARCHAR(100) NOT NULL,
            reportedByUid UUID NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            severity VARCHAR(20) NOT NULL DEFAULT 'low',
            affectedPigCount INTEGER NOT NULL DEFAULT 0,
            isVerified BOOLEAN DEFAULT false,
            verifiedByUid UUID,
            verificationDate TIMESTAMP,
            FOREIGN KEY(reportedByUid) REFERENCES blnbtghog_owners(uid) ON DELETE SET NULL,
            FOREIGN KEY(verifiedByUid) REFERENCES blnbtghog_owners(uid) ON DELETE SET NULL,
            CONSTRAINT valid_report_latitude CHECK (latitude >= -90 AND latitude <= 90),
            CONSTRAINT valid_report_longitude CHECK (longitude >= -180 AND longitude <= 180)
        );

CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            userId UUID,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL DEFAULT 'info',
            isRead BOOLEAN DEFAULT false,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            isGlobal BOOLEAN DEFAULT false,
            FOREIGN KEY(userId) REFERENCES blnbtghog_owners(uid) ON DELETE CASCADE
        );

CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tableName VARCHAR(50) NOT NULL,
            recordId UUID NOT NULL,
            action VARCHAR(20) NOT NULL,
            oldData TEXT,
            newData TEXT,
            userId UUID,
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES blnbtghog_owners(uid) ON DELETE SET NULL,
            CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
        );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email ON blnbtghog_owners(emailAddress);
CREATE INDEX IF NOT EXISTS idx_role ON blnbtghog_owners(role);
CREATE INDEX IF NOT EXISTS idx_status ON blnbtghog_owners(status);
CREATE INDEX IF NOT EXISTS idx_verification_token ON blnbtghog_owners(verificationToken);

CREATE INDEX IF NOT EXISTS idx_farm_owner ON farms(ownerUid);
CREATE INDEX IF NOT EXISTS idx_farm_location ON farms(city, province);
CREATE INDEX IF NOT EXISTS idx_farm_status ON farms(status);

CREATE INDEX IF NOT EXISTS idx_hog_farm ON hogs(farmId);

CREATE INDEX IF NOT EXISTS idx_report_date ON asf_outbreak_reports(dateReported);
CREATE INDEX IF NOT EXISTS idx_report_location ON asf_outbreak_reports(barangay, municipality, province);
CREATE INDEX IF NOT EXISTS idx_report_status ON asf_outbreak_reports(status);
CREATE INDEX IF NOT EXISTS idx_report_severity ON asf_outbreak_reports(severity);

CREATE INDEX IF NOT EXISTS idx_notification_user ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notifications(isRead);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notifications(createdAt);
CREATE INDEX IF NOT EXISTS idx_notification_global ON notifications(isGlobal);

CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_logs(recordId);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(tableName);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);