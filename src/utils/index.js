import * as XLSX from "xlsx";
import { invoke } from "@tauri-apps/api/core";
import { notification } from "antd";
import dayjs from "dayjs";

export async function saveFile(path, data) {
  try {
    await invoke("save_file", { fileName: path, fileData: data });
  } catch (err) {
    console.error("Failed to write file:", err);
    notification.error("Error saving file");
  }
}

export const runLeaveEncashmentBatch = async (month, db) => {

  const encashmentQuery = `
    SELECT 
      e.id AS employee_id,
      e.base_salary,
      e.leaves_allotted,
      IFNULL(s.leaves_used, 0) AS leaves_used,
      (e.leaves_allotted - IFNULL(s.leaves_used, 0)) AS remaining_leaves,
    FROM Employees e
    LEFT JOIN Salaries s ON e.id = s.employee_id AND s.month = ?
    WHERE e.status = 'Active'
  `;

  const results = await db.select(encashmentQuery, [month]);

  for (const employee of results) {
    if (employee.remaining_leaves > 0) {
      const encashmentAmount = (employee.base_salary / countWorkingDays(month)) * employee.remaining_leaves;
      const updateSalaryQuery = `
        UPDATE Salaries
        SET 
          leave_encashment = ?,
          net_salary = net_salary + ?
        WHERE employee_id = ? AND month = ?
      `;

      await db.execute(updateSalaryQuery, [
        encashmentAmount,
        encashmentAmount,
        employee.employee_id,
        month,
      ]);
    }
  }

  console.log("Leave encashment batch completed.");
};


const taxables = ["ceo", "director"];

export const getTax = (department = "", designation = null) => {
  debugger;
  const lowerCaseDepartment = department.toLowerCase();
  if (!designation && lowerCaseDepartment === "bank") {
    return 4 * 113750;
  }
  if (
    lowerCaseDepartment === "bank" &&
    taxables.includes(designation.toLowerCase())
  ) {
    return 113750;
  }
  return 0;
};

export const getHourlySalary = (salary, working_hours, month) => {
  const days =
    working_hours === 24 ? dayjs(month).daysInMonth() : countWorkingDays(month);
  return salary / days / working_hours;
};

export function countWorkingDays(yyyyMm) {
  const start = dayjs(yyyyMm + "-01");
  const daysInMonth = start.daysInMonth();
  let count = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const date = start.date(i);
    if (date.day() === 0) {
      // Sunday
      count++;
    }
  }

  return daysInMonth - count;
}

export const exportToExcel = async (data, columns, fileName) => {
  try {
    // Extract headers and keys from columns
    const headers = columns.map((col) => col.title);
    const keys = columns.map((col) => col.dataIndex);

    // Prepare worksheet data
    const worksheetData = [
      headers,
      ...data.map((item) => keys.map((key) => item[key])),
    ];

    // Create a worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Generate Excel file as a binary string
    const excelBinary = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "binary",
    });

    // Convert the binary string to a Uint8Array
    const excelBuffer = new Uint8Array(
      excelBinary.split("").map((char) => char.charCodeAt(0))
    );

    // Use your custom Tauri command to save the file
    await saveFile(fileName, excelBuffer);

    notification.success({
      message: `File successfully saved as: ${fileName}`,
    });
  } catch (error) {
    console.error("Failed to export Excel file:", error);
  }
};
