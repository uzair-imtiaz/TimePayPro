#[cfg_attr(mobile, tauri::mobile_entry_point)]
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

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
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:employee_management.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        // .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
