USE medibook;



INSERT INTO patients
(id, first_name, last_name, email, phone)
VALUES
(1, 'Ama', 'Mensah', 'ama@mail.com', '0244111222'),
(2, 'Kojo', 'Owusu', 'kojo@mail.com', '0555333444'),
(3, 'Abena', 'Asante', 'abena@mail.com', '0205556666');



INSERT INTO doctors
(id, first_name, last_name, email, specialty, consultation_fee, room)
VALUES
(1, 'Joseph ', 'Silver', 'silver@medibook.com',
 'Dermatology', 150.00, 'R-12'),

(2, 'Akosua', 'Tommy', 'tommy@medibook.com',
 'Paediatrics', 100.00, 'R-03'),

(3, 'Kofi', 'Parker', 'parker@medibook.com',
 'Cardiology', 200.00, 'R-08');



INSERT INTO appointments
(reference, patient_id, doctor_id, appointment_datetime,
 consultation_fee, amount_paid, status)
VALUES

('AP-001', 1, 1, '2026-12-01 09:00:00', 150.00, 150.00, 'booked'),
('AP-002', 2, 1, '2026-12-01 09:30:00', 150.00, 120.00, 'booked'),
('AP-003', 3, 1, '2026-12-01 10:00:00', 150.00, 150.00, 'booked'),
('AP-004', 1, 1, '2026-12-01 10:30:00', 150.00, 150.00, 'booked'),
('AP-005', 2, 1, '2026-12-01 11:00:00', 150.00, 100.00, 'booked'),
('AP-006', 3, 1, '2026-12-01 11:30:00', 150.00, 150.00, 'booked'),
('AP-007', 1, 1, '2026-12-01 12:00:00', 150.00, 150.00, 'booked'),
('AP-008', 2, 1, '2026-12-01 12:30:00', 150.00, 150.00, 'booked'),
('AP-009', 3, 1, '2026-12-01 13:00:00', 150.00, 150.00, 'booked'),
('AP-010', 1, 1, '2026-12-01 13:30:00', 150.00, 150.00, 'booked'),

-- Doctor 2: appointments on another day.

('AP-011', 2, 2, '2026-12-02 09:00:00', 100.00, 100.00, 'booked'),
('AP-012', 3, 2, '2026-12-02 09:30:00', 100.00, 100.00, 'booked');
