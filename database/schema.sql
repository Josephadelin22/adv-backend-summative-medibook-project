
-- ============================================
-- MEDIBOOK DATABASE SCHEMA
-- Backend Development Final Assessment
-- ============================================

CREATE DATABASE IF NOT EXISTS medibook
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE medibook;

-- Remove existing tables when rebuilding
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS doctors;

-- ============================================
-- TABLE: patients
-- ============================================

CREATE TABLE patients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,

    email VARCHAR(254) NOT NULL UNIQUE,
    phone VARCHAR(25) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- TABLE: doctors
-- ============================================

CREATE TABLE doctors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,

    email VARCHAR(254) NOT NULL UNIQUE,
    specialty VARCHAR(100) NOT NULL,

    consultation_fee DECIMAL(10,2) NOT NULL,
    room VARCHAR(20) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_doctor_fee
        CHECK (consultation_fee >= 0)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: appointments
-- ============================================

CREATE TABLE appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    reference VARCHAR(20) NOT NULL UNIQUE,

    patient_id BIGINT UNSIGNED NOT NULL,
    doctor_id BIGINT UNSIGNED NOT NULL,

    appointment_datetime DATETIME NOT NULL,

    consultation_fee DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,

    status ENUM(
        'booked',
        'cancelled',
        'completed',
        'no_show'
    ) NOT NULL DEFAULT 'booked',

    refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    booked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at DATETIME NULL,

    -- Cancelled appointments release their slots.
    -- MySQL UNIQUE indexes permit multiple NULL values.
    active_slot TINYINT
        GENERATED ALWAYS AS (
            CASE
                WHEN status = 'cancelled' THEN NULL
                ELSE 1
            END
        ) STORED,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_appointment_fee
        CHECK (consultation_fee >= 0),

    CONSTRAINT chk_amount_paid
        CHECK (
            amount_paid >= 0
            AND amount_paid <= consultation_fee
        ),

    CONSTRAINT chk_refund_amount
        CHECK (
            refund_amount >= 0
            AND refund_amount <= amount_paid
        ),

    CONSTRAINT chk_cancellation_status
        CHECK (
            (status = 'cancelled' AND cancelled_at IS NOT NULL)
            OR
            (status != 'cancelled' AND cancelled_at IS NULL)
        ),

    CONSTRAINT chk_refund_status
        CHECK (
            status = 'cancelled' OR refund_amount = 0
        ),

    -- Prevent duplicate active appointments
    -- for the same doctor and date/time.
    CONSTRAINT uq_doctor_active_slot
        UNIQUE (
            doctor_id,
            appointment_datetime,
            active_slot
        ),

    INDEX idx_patient_appointments (patient_id),
    INDEX idx_doctor_appointments (doctor_id),
    INDEX idx_appointment_datetime (appointment_datetime),
    INDEX idx_appointment_status (status)

) ENGINE=InnoDB;
      