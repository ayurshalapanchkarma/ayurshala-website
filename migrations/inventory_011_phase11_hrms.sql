-- Phase 11: Human Resource Management System
-- Employees, Attendance, Leave, Payroll, Performance

-- Enums
CREATE TYPE employee_status AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'EARLY_EXIT', 'LEAVE');
CREATE TYPE leave_status AS ENUM ('APPLIED', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE shift_type AS ENUM ('MORNING', 'EVENING', 'SPLIT', 'ROTATING', 'CUSTOM');
CREATE TYPE payroll_status AS ENUM ('DRAFT', 'APPROVED', 'PROCESSED', 'PAID', 'DISPUTED');

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(10),
  date_of_birth DATE,
  joining_date DATE NOT NULL,
  photo_url VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(20),
  emergency_contact VARCHAR(100),
  blood_group VARCHAR(5),
  address TEXT,
  aadhaar VARCHAR(12),
  pan VARCHAR(10),
  status employee_status DEFAULT 'ACTIVE',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Employee Departments
CREATE TABLE employee_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  department_id UUID NOT NULL,
  designation VARCHAR(100),
  manager_id UUID REFERENCES employees(id),
  from_date DATE NOT NULL,
  to_date DATE,
  is_current BOOLEAN DEFAULT true
);

-- Employee Bank Accounts
CREATE TABLE employee_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  account_holder_name VARCHAR(255),
  bank_name VARCHAR(100),
  account_number VARCHAR(20),
  ifsc_code VARCHAR(20),
  is_primary BOOLEAN DEFAULT true
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  attendance_date DATE NOT NULL,
  status attendance_status NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  break_start TIMESTAMP,
  break_end TIMESTAMP,
  overtime_hours NUMERIC(5, 2),
  remarks TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- Attendance Logs
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  log_type VARCHAR(50),
  log_timestamp TIMESTAMP DEFAULT NOW(),
  location VARCHAR(100),
  device_info VARCHAR(255)
);

-- Leave Types
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type_name VARCHAR(50) NOT NULL UNIQUE,
  annual_allocation INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Leave Requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days_count NUMERIC(5, 2),
  reason TEXT,
  status leave_status DEFAULT 'APPLIED',
  approved_by UUID REFERENCES employees(id),
  approval_date TIMESTAMP,
  approved_remarks TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leave Balances
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  opening_balance NUMERIC(5, 2),
  allocated NUMERIC(5, 2),
  used NUMERIC(5, 2) DEFAULT 0,
  closing_balance NUMERIC(5, 2),
  UNIQUE(employee_id, leave_type_id, year)
);

-- Shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_name VARCHAR(50) NOT NULL UNIQUE,
  shift_type shift_type NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Employee Shifts
CREATE TABLE employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  from_date DATE NOT NULL,
  to_date DATE,
  is_current BOOLEAN DEFAULT true
);

-- Salary Structures
CREATE TABLE salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  base_salary NUMERIC(12, 2) NOT NULL,
  hra NUMERIC(12, 2) DEFAULT 0,
  dearness_allowance NUMERIC(12, 2) DEFAULT 0,
  medical_allowance NUMERIC(12, 2) DEFAULT 0,
  other_allowances NUMERIC(12, 2) DEFAULT 0,
  pf_percentage NUMERIC(5, 2) DEFAULT 0,
  esi_percentage NUMERIC(5, 2) DEFAULT 0,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_current BOOLEAN DEFAULT true
);

-- Payroll
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_month DATE NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id),
  status payroll_status DEFAULT 'DRAFT',
  gross_salary NUMERIC(12, 2),
  net_salary NUMERIC(12, 2),
  processed_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(payroll_month, employee_id)
);

-- Payroll Items
CREATE TABLE payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id UUID NOT NULL REFERENCES payroll(id),
  item_type VARCHAR(50),
  item_name VARCHAR(100),
  amount NUMERIC(12, 2),
  is_deduction BOOLEAN DEFAULT false
);

-- Employee Performance
CREATE TABLE employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  review_date DATE NOT NULL,
  attendance_percentage NUMERIC(5, 2),
  work_quality INTEGER CHECK (work_quality BETWEEN 1 AND 5),
  teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 5),
  punctuality INTEGER CHECK (punctuality BETWEEN 1 AND 5),
  overall_rating NUMERIC(3, 1),
  comments TEXT,
  reviewed_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employee Training
CREATE TABLE employee_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  training_name VARCHAR(255),
  certificate_url VARCHAR(500),
  completion_date DATE,
  expiry_date DATE,
  issued_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employee Documents
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  document_type VARCHAR(50),
  document_url VARCHAR(500),
  expiry_date DATE,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_joining_date ON employees(joining_date);
CREATE INDEX idx_employee_departments_employee ON employee_departments(employee_id);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX idx_attendance_logs_employee ON attendance_logs(employee_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX idx_payroll_employee_month ON payroll(employee_id, payroll_month);
CREATE INDEX idx_payroll_status ON payroll(status);
CREATE INDEX idx_employee_performance_employee ON employee_performance(employee_id);
CREATE INDEX idx_employee_training_employee ON employee_training(employee_id);
