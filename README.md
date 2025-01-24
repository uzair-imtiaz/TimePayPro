# Employee Attendance & Payroll Management System

A desktop application for managing employee attendance, and payroll built using Tauri and React. The application provides a comprehensive solution for attendance tracking, and salary calculation, designed for a single user.

---

## Features

### **Employee Management**

- Add, update, and delete employee records.
- Categorize employees by departments and roles.
- Support for hourly waged and salaried employees.

### **Attendance Management**

- Mark daily attendance for employees.
- Track overtime hours worked.
- Maintain a record of advances and tax deductions.

### **Payroll Management**

- Real-time salary calculation based on:
  - Attendance
  - Overtime
  - Advances
  - Taxes
  - Allowances
- Department-specific salary rates and increment policies.
- Monthly, department-based, and individual employee salary reports.

### **Filters & Search**

- Filter records by date, department, or employee.
- Search employees by first name or last name.
- Timeframe filtering for reports (monthly or custom date range).

---

## Tech Stack

- **Frontend:** React, Ant Design (Antd)
- **Backend:** Tauri (Rust) for desktop app functionality
- **Database:** SQLite for data storage
- **Utilities:** Day.js for date handling

---

## Setup Instructions

### **Prerequisites**

- Node.js (v14 or higher)
- Rust (for Tauri)
- Yarn or npm
- SQLite installed locally

### **Installation**

1. Clone the repository:

   ```bash
   git clone <repository_url>
   cd <repository_name>
   ```

2. Install dependencies:

   ```bash
   yarn install
   or
   npm install
   ```

3. Run the development server:
   ```bash
   yarn tauri dev
   or
   npm run tauri dev
   ```
4. Build the application:
   ```bash
   yarn tauri build
   or
   npm run tauri build
   ```

### **Usage**

1. Launch the application.

2. Navigate between the following modules:

   - Dashboard: Overview of key metrics.
   - Employees: Manage employee records.
   - Attendance: Mark and update attendance records.
   - Payroll: Generate salary reports and manage payments.

3. Use filters and search options to narrow down data views:

   - Filter by department, date range, or individual employees.
   - Search employees by name.
