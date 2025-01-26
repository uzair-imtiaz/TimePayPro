use base64::{engine::general_purpose, Engine};
use std::fs;
use std::io::Write;
use std::path::Path;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
use tauri_plugin_sql::{Migration, MigrationKind};

// use serde_json::Value;
// use std::fs::File;
// use tauri::Manager;

// #[tauri::command]
// fn export_to_excel(report_data: Value) -> Result<String, String> {
//     // Create a new workbook
//     let mut workbook = Workbook::create("report.xlsx");
//     let mut sheet = workbook.create_sheet("Report");

//     // Configure the sheet
//     sheet.add_column(Column { width: 30.0 }); // Adjust column width if necessary
//     sheet.add_column(Column { width: 20.0 }); // Add more columns as needed

//     // Write header row
//     let headers = if let Some(first_row) = report_data.as_array().and_then(|arr| arr.get(0)) {
//         first_row
//             .as_object()
//             .map(|obj| obj.keys().cloned().collect::<Vec<String>>())
//             .unwrap_or_default()
//     } else {
//         return Err("Invalid data format: Expected an array of objects.".to_string());
//     };

//     workbook
//         .write_sheet(&mut sheet, |sheet_writer| {
//             let sw = sheet_writer?;
//             sw.append_row(headers.iter().map(|h| h.as_str()))?;
//             Ok(())
//         })
//         .map_err(|e| e.to_string())?;

//     // Write data rows
//     if let Value::Array(rows) = report_data {
//         workbook
//             .write_sheet(&mut sheet, |sheet_writer| {
//                 let sw = sheet_writer?;
//                 for row in rows {
//                     if let Value::Object(row_map) = row {
//                         let data = headers
//                             .iter()
//                             .map(|key| row_map.get(key).map(|v| v.to_string()).unwrap_or_default());
//                         sw.append_row(data)?;
//                     }
//                 }
//                 Ok(())
//             })
//             .map_err(|e| e.to_string())?;
//     }

//     // Save the workbook
//     workbook.close().map_err(|e| e.to_string())?;

//     // Return the path of the generated file
//     Ok("report.xlsx".to_string())
//

use dirs;
use std::path::PathBuf;

#[tauri::command]
fn save_file(file_name: String, file_data: Vec<u8>) -> Result<(), String> {
    // Save the file to the user's desktop
    let mut path = dirs::desktop_dir().ok_or("Could not find desktop directory")?;
    path.push(file_name);

    fs::write(&path, file_data).map_err(|e| format!("Failed to save file: {}", e))?;
    Ok(())
}

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
        Migration {
            version: 7,
            description: "add_overtime_rate_to_employees",
            sql: "
            ALTER TABLE Employees ADD COLUMN overtime_rate REAL DEFAULT 0;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "add_unique_constraint_to_attendance_and_salaries",
            sql: "
            DROP TABLE IF EXISTS Attendance;
            DROP TABLE IF EXISTS Salaries;

            CREATE TABLE Attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT CHECK(status IN ('Present', 'Absent', 'Leave')) NOT NULL,
                check_in_time TEXT,
                check_out_time TEXT,
                FOREIGN KEY (employee_id) REFERENCES Employees(id),
                UNIQUE (employee_id, date)
            );

            CREATE TABLE Salaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                month TEXT NOT NULL,
                gross_salary REAL NOT NULL,
                advance REAL DEFAULT 0,
                tax REAL DEFAULT 0,
                overtime_hours_worked REAL DEFAULT 0,
                leaves_used REAL DEFAULT 0,
                net_salary REAL NOT NULL,
                FOREIGN KEY (employee_id) REFERENCES Employees(id),
                UNIQUE (employee_id, month)
            );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "add_working_hours_to_employees",
            sql: "
            ALTER TABLE Employees ADD COLUMN working_hours REAL DEFAULT 0;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "add_short_time_to_salaries",
            sql: "
            ALTER TABLE Salaries ADD COLUMN short_time REAL DEFAULT 0;
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "add_designation_to_employees",
            sql: "
            ALTER TABLE Employees ADD COLUMN designation TEXT;
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
        .invoke_handler(tauri::generate_handler![save_image, save_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
