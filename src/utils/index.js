import * as XLSX from "xlsx";
import { save } from "@tauri-apps/api/dialog";
import { writeBinaryFile } from "@tauri-apps/api/fs";
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

export const exportToExcel = async (data, defaultFileName = "Report.xlsx") => {
  const filePath = await save({
    filters: [
      {
        name: "Excel Files",
        extensions: ["xlsx"],
      },
    ],
    defaultPath: defaultFileName,
  });

  // If the user cancels the dialog, filePath will be null
  if (!filePath) {
    console.log("User canceled the save dialog.");
    return;
  }

  // Generate workbook and convert to binary
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const binary = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

  // Save the file to the selected path
  await writeBinaryFile(filePath, binary);

  console.log(`File saved at: ${filePath}`);
};
