use base64::{engine::general_purpose, Engine};
use std::fs;
use std::io::Write;
use std::path::Path;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn save_image(file_name: String, base64_content: String) -> Result<(), String> {
    let path = Path::new("images").join(file_name);

    // Decode the Base64 content
    let decoded_content = general_purpose::STANDARD
        .decode(&base64_content)
        .map_err(|e| e.to_string())?;

    // Create the directory if it doesn't exist
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Write the file to disk
    let mut file = fs::File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(&decoded_content)
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_employees_table",
            sql: "CREATE TABLE IF NOT EXISTS Employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            father_name TEXT NOT NULL,
            cnic TEXT NOT NULL,
            address TEXT NOT NULL,
            department_id INTEGER NOT NULL,
            wage_type TEXT CHECK(wage_type IN ('Hourly', 'Monthly')) NOT NULL,
            hourly_rate REAL,
            base_salary REAL,
            date_of_joining DATE,
            status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')) NOT NULL,
            picture_path TEXT,
            FOREIGN KEY (department_id) REFERENCES Departments(id)
        );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_departments_table",
            sql: "CREATE TABLE IF NOT EXISTS Departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "update_employees_table_drop_departments_and_modify_department",
            sql: "
            
            -- Drop the Employees table
            DROP TABLE IF EXISTS Employees;
            
            -- Drop the Departments table
            DROP TABLE IF EXISTS Departments;
    
    
            -- Create a new Employees table with the updated schema
            CREATE TABLE Employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                father_name TEXT NOT NULL,
                cnic TEXT NOT NULL,
                address TEXT NOT NULL,
                department TEXT NOT NULL,
                wage_type TEXT CHECK(wage_type IN ('Hourly', 'Monthly')) NOT NULL,
                hourly_rate REAL,
                base_salary REAL,
                date_of_joining DATE,
                status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')) NOT NULL,
                picture_path TEXT
            );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_attendance_and_salary_table",
            sql: "
            CREATE TABLE IF NOT EXISTS Attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT CHECK(status IN ('Present', 'Absent', 'Leave')) NOT NULL,
                check_in_time TEXT NOT NULL,
                check_out_time TEXT NOT NULL,
                hours_worked REAL,
                FOREIGN KEY (employee_id) REFERENCES Employees(id)
            );
            CREATE TABLE IF NOT EXISTS Salaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                month TEXT NOT NULL,        -- Format: YYYY-MM
                gross_salary REAL NOT NULL,
                deductions REAL DEFAULT 0,
                bonuses REAL DEFAULT 0,
                net_salary REAL NOT NULL,
                FOREIGN KEY (employee_id) REFERENCES Employees(id)
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "update_employee_and_salary_tables",
            sql: "
            -- Drop and recreate all tables

            -- Drop old tables
            DROP TABLE IF EXISTS Attendance;
            DROP TABLE IF EXISTS Salaries;
            DROP TABLE IF EXISTS Employees;

            -- Recreate Employees table with updated schema
            CREATE TABLE Employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                father_name TEXT NOT NULL,
                cnic TEXT NOT NULL,
                address TEXT NOT NULL,
                department TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                guardian_phone_number TEXT NOT NULL,
                cnic_image_path TEXT DEFAULT '',
                allowance REAL DEFAULT 0,
                base_salary REAL,
                date_of_joining DATE,
                leaves_allotted REAL DEFAULT 0,
                status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')) NOT NULL,
                picture_path TEXT
            );

            -- Recreate Salaries table with updated schema
            CREATE TABLE Salaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                month TEXT NOT NULL,        -- Format: YYYY-MM
                gross_salary REAL NOT NULL,
                advance REAL DEFAULT 0,
                tax REAL DEFAULT 0,
                overtime_hours_worked REAL DEFAULT 0,
                leaves_used REAL DEFAULT 0,
                net_salary REAL NOT NULL,
                FOREIGN KEY (employee_id) REFERENCES Employees(id)
            );

            -- Recreate Attendance table with updated schema
            CREATE TABLE Attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT CHECK(status IN ('Present', 'Absent', 'Leave')) NOT NULL,
                check_in_time TEXT NOT NULL,
                check_out_time TEXT NOT NULL,
                FOREIGN KEY (employee_id) REFERENCES Employees(id)
            );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "make check_in_time and check_out_time nullable",
            sql: "
            DROP TABLE IF EXISTS Attendance;

            CREATE TABLE Attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT CHECK(status IN ('Present', 'Absent', 'Leave')) NOT NULL,
                check_in_time TEXT,
                check_out_time TEXT,
                FOREIGN KEY (employee_id) REFERENCES Employees(id)
            );
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:employee_management.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![save_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
