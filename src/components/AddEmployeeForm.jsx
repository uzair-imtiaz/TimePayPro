import React, { useState, useEffect } from "react";
import { Input, Button, Select, notification } from "antd";
import { useFormik } from "formik";
import * as Yup from "yup";
import { invoke } from "@tauri-apps/api/core";
import { useDatabase } from "../context/DatabaseContext";
import PictureUpload from "./PictureUpload";
import { departments } from "../constants/departments";
import { useParams } from "react-router-dom";

const { Option } = Select;

const AddEmployeeForm = () => {
  const { id } = useParams();
  const db = useDatabase();
  const [loading, setLoading] = useState(false);

  const [pictureFile, setPictureFile] = useState(null);
  const [cnicImageFile, setCnicImageFile] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const [employee] = await db.select(
          "SELECT * FROM employees WHERE id = ?",
          [id]
        );
        if (employee) {
          formik.setValues({
            firstName: employee.first_name,
            lastName: employee.last_name,
            fatherName: employee.father_name,
            cnic: employee.cnic,
            phoneNumber: employee.phone_number,
            guardianPhoneNumber: employee.guardian_phone_number,
            address: employee.address,
            department: employee.department,
            allowance: employee.allowance,
            baseSalary: employee.base_salary,
            leavesAllotted: employee.leaves_allotted,
            overtimeRate: employee.overtime_rate,
            workingHours: employee.working_hours,
            designation: employee.designation,
          });
        }
      } catch (error) {
        console.error("Error fetching employee:", error);
        notification.error({
          message: "Error",
          description: "Failed to load employee data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      fatherName: "",
      cnic: "",
      phoneNumber: "",
      guardianPhoneNumber: "",
      address: "",
      department: departments[0]?.name,
      allowance: 0,
      baseSalary: "",
      leavesAllotted: 0,
      overtimeRate: 0,
      workingHours: 0,
      designation: "",
    },

    validationSchema: Yup.object({
      firstName: Yup.string().required("Please input the first name!"),
      lastName: Yup.string().required("Please input the last name!"),
      fatherName: Yup.string().required("Please input the father's name!"),
      cnic: Yup.string()
        .matches(/^\d{13}$/, "CNIC must be exactly 13 digits")
        .required("Please input the CNIC!"),
      phoneNumber: Yup.string()
        .matches(/^\d{10,15}$/, "Phone number must be between 10 and 15 digits")
        .required("Please input the phone number!"),
      guardianPhoneNumber: Yup.string()
        .matches(
          /^\d{10,15}$/,
          "Guardian phone number must be between 10 and 15 digits"
        )
        .required("Please input the guardian's phone number!"),
      address: Yup.string().required("Please input the address!"),
      department: Yup.string().required("Please select a department!"),
      allowance: Yup.number()
        .min(0, "Allowance cannot be negative")
        .required("Please input the allowance!"),
      baseSalary: Yup.number()
        .min(0, "Base salary cannot be negative")
        .required("Please input the base salary!"),
      leavesAllotted: Yup.number()
        .min(0, "Leaves allotted cannot be negative")
        .required("Please input the number of leaves allotted!"),
      overtimeRate: Yup.number()
        .min(0, "Overtime rate cannot be negative")
        .required("Please input the overtime rate!"),
      workingHours: Yup.number()
        .min(0, "Working hours cannot be negative")
        .required("Please input the working hours!"),
      designation: Yup.string().required("Please input the designation!"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        let picturePath = null;
        let cnicImagePath = null;

        if (pictureFile) {
          const pictureName = `${Date.now()}_${pictureFile.name}`;
          picturePath = `images/${pictureName}`;
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Image = e.target.result.split(",")[1];
            await invoke("save_image", {
              fileName: pictureName,
              base64Content: base64Image,
            });
          };
          reader.readAsDataURL(pictureFile);
        }

        if (cnicImageFile) {
          const cnicImageName = `${Date.now()}_${cnicImageFile.name}`;
          cnicImagePath = `images/${cnicImageName}`;
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Image = e.target.result.split(",")[1];
            await invoke("save_image", {
              fileName: cnicImageName,
              base64Content: base64Image,
            });
          };
          reader.readAsDataURL(cnicImageFile);
        }

        if (id) {
          const result = await db.execute(
            `UPDATE employees SET 
              first_name = $1, last_name = $2, father_name = $3, 
              cnic = $4, phone_number = $5, guardian_phone_number = $6, 
              address = $7, department = $8, allowance = $9, 
              base_salary = $10, leaves_allotted = $11, 
              picture_path = COALESCE($12, picture_path), 
              cnic_image_path = COALESCE($13, cnic_image_path),
              overtime_rate = $14, working_hours = $15,
              designation = $16
            WHERE id = $17`,
            [
              values.firstName,
              values.lastName,
              values.fatherName,
              values.cnic,
              values.phoneNumber,
              values.guardianPhoneNumber,
              values.address,
              values.department,
              values.allowance,
              values.baseSalary,
              values.leavesAllotted,
              picturePath,
              cnicImagePath,
              values.overtimeRate,
              values.workingHours,
              values.designation,
              id,
            ]
          );
          if (result?.lastInsertRowId) {
            notification.success({
              message: "Employee Updated",
              description: "The employee was successfully updated.",
            });
          } else {
            notification.error({
              message: "Error",
              description: "Failed to update the employee.",
            });
          }
        } else {
          const result = await db.execute(
            "INSERT INTO employees (first_name, last_name, father_name, cnic, phone_number, guardian_phone_number, address, department, allowance, base_salary, leaves_allotted, date_of_joining, status, picture_path, cnic_image_path, overtime_rate, working_hours, designation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
            [
              values.firstName,
              values.lastName,
              values.fatherName,
              values.cnic,
              values.phoneNumber,
              values.guardianPhoneNumber,
              values.address,
              values.department,
              values.allowance,
              values.baseSalary,
              values.leavesAllotted,
              new Date().toISOString().split("T")[0],
              "Active",
              picturePath,
              cnicImagePath,
              values.overtimeRate,
              values.workingHours,
              values.designation,
            ]
          );
          if (result?.lastInsertRowId) {
            notification.success({
              message: "Employee Added",
              description: "The employee was successfully added.",
            });
          }
        }

        resetForm();
        setPictureFile(null);
        setCnicImageFile(null);
        navigate("/employees");
      } catch (error) {
        console.error("Error saving employee:", error);
        notification.error({
          message: "Error",
          description: "There was an error saving the employee.",
        });
      }
    },
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form
      onSubmit={formik.handleSubmit}
      style={{ maxWidth: "800px", margin: "0 auto" }}
    >
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {/* Left Column */}
        <div>
          <div style={{ marginBottom: "16px" }}>
            <label>First Name</label>
            <Input
              name="firstName"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter employee first name"
            />
            {formik.touched.firstName && formik.errors.firstName && (
              <div style={{ color: "red", marginTop: "5px" }}>
                {formik.errors.firstName}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Father's Name</label>
            <Input
              name="fatherName"
              value={formik.values.fatherName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter father's name"
            />
            {formik.touched.fatherName && formik.errors.fatherName && (
              <div style={{ color: "red", marginTop: "5px" }}>
                {formik.errors.fatherName}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Phone Number</label>
            <Input
              name="phoneNumber"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter phone number"
            />
            {formik.touched.phoneNumber && formik.errors.phoneNumber && (
              <div style={{ color: "red", marginTop: "5px" }}>
                {formik.errors.phoneNumber}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Department</label>
            <Select
              name="department"
              value={formik.values.department}
              onChange={(value) => formik.setFieldValue("department", value)}
              onBlur={formik.handleBlur}
              style={{ width: "100%" }}
            >
              {departments.map((dept) => (
                <Option key={dept.name} value={dept.name}>
                  {dept.name}
                </Option>
              ))}
            </Select>
            {formik.touched.department && formik.errors.department && (
              <div style={{ color: "red", marginTop: "5px" }}>
                {formik.errors.department}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Base Salary</label>
            <Input
              name="baseSalary"
              type="number"
              value={formik.values.baseSalary}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter base salary amount"
            />
            {formik.touched.baseSalary && formik.errors.baseSalary && (
              <div style={{ color: "red", marginTop: "5px" }}>
                {formik.errors.baseSalary}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Picture</label>
            <PictureUpload setPictureFile={setPictureFile} />
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div style={{ marginBottom: "16px" }}>
            <label>Last Name</label>
            <Input
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter employee last name"
            />
            {formik.touched.lastName && formik.errors.lastName && (
              <div style={{ color: "red", marginTop: "5px" }}>
                {formik.errors.lastName}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>CNIC</label>
            <Input
              name="cnic"
              value={formik.values.cnic}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter 13-digit CNIC number"
            />
            {formik.touched.cnic && formik.errors.cnic && (
              <div style={{ color: "red", marginTop: "5px" }}>
                {formik.errors.cnic}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Guardian Phone Number</label>
            <Input
              name="guardianPhoneNumber"
              value={formik.values.guardianPhoneNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter guardian's phone number"
            />
            {formik.touched.guardianPhoneNumber &&
              formik.errors.guardianPhoneNumber && (
                <div style={{ color: "red", marginTop: "5px" }}>
                  {formik.errors.guardianPhoneNumber}
                </div>
              )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Allowance</label>
            <Input
              name="allowance"
              type="number"
              value={formik.values.allowance}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter allowance amount"
            />
            {formik.touched.allowance && formik.errors.allowance && (
              <div style={{ color: "red", marginTop: "5px" }}>
                {formik.errors.allowance}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Leaves Allotted</label>
            <Input
              name="leavesAllotted"
              type="number"
              value={formik.values.leavesAllotted}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter number of leaves allotted"
            />
            {formik.touched.leavesAllotted && formik.errors.leavesAllotted && (
              <div style={{ color: "red", marginTop: "5px" }}>
                {formik.errors.leavesAllotted}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>CNIC Image</label>
            <PictureUpload setPictureFile={setCnicImageFile} />
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Working Hours</label>
          <Input
            name="workingHours"
            type="number"
            value={formik.values.workingHours}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter working hours"
          />
        </div>
        {formik.touched.workingHours && formik.errors.workingHours && (
          <div style={{ color: "red", marginTop: "5px" }}>
            {formik.errors.workingHours}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label>Overtime Rate</label>
          <Input
            name="overtimeRate"
            type="number"
            value={formik.values.overtimeRate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter overtime rate"
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Designation</label>
          <Input
            name="designation"
            value={formik.values.designation}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter designation"
          />
          {formik.touched.designation && formik.errors.designation && (
            <div style={{ color: "red", marginTop: "5px" }}>
              {formik.errors.designation}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Address</label>
          <Input.TextArea
            name="address"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter address"
          />
          {formik.touched.address && formik.errors.address && (
            <div style={{ color: "red", marginTop: "5px" }}>
              {formik.errors.address}
            </div>
          )}
        </div>
      </div>

      <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
        {id ? "Update Employee" : "Add Employee"}
      </Button>
    </form>
  );
};

export default AddEmployeeForm;
