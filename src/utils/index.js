import * as XLSX from "xlsx";
import { invoke } from "@tauri-apps/api/core";
import { notification } from "antd";

async function saveFile(path, data) {
  try {
    await invoke("save_file", { fileName: path, fileData: data });
  } catch (err) {
    console.error("Failed to write file:", err);
  }
}

const taxables = ["ceo", "director"];

export const getTax = (department, designation = null) => {
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

export const getHourlySalary = (salary, working_hours, days) => {
  return salary / days / working_hours;
};

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
