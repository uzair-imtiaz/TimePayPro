import React, { useEffect, useState } from "react";
import { Input, Button, Select, notification, Upload } from "antd";
import { useFormik } from "formik";
import * as Yup from "yup";
import { invoke } from "@tauri-apps/api/core";
// import Database from "@tauri-apps/plugin-sql";
import { useDatabase } from "../context/DatabaseContext";
import PictureUpload from "./PictureUpload";

const { Option } = Select;

const AddEmployeeForm = () => {
  const db = useDatabase();
  const f = async (values) => {
    const result = await db.execute(
      "INSERT into employees (first_name, last_name, father_name, cnic, address, department_id, wage_type, hourly_rate, base_salary, date_of_joining, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [
        values.firstName,
        values.lastName,
        values.fatherName,
        values.cnic,
        values.address,
        values.departmentId,
        wageType,
        values.hourlyRate,
        values.baseSalary,
        new Date(),
        "Active",
      ]
    );
  };
  const [wageType, setWageType] = useState("Monthly");
  const [pictureFile, setPictureFile] = useState(null);

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      fatherName: "",
      cnic: "",
      address: "",
      departmentId: "",
      hourlyRate: "",
      baseSalary: "",
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required("Please input the first name!"),
      lastName: Yup.string().required("Please input the last name!"),
      fatherName: Yup.string().required("Please input the father name!"),
      cnic: Yup.string()
        .matches(/^\d{13}$/, "CNIC must be exactly 13 digits")
        .required("Please input the CNIC!"),
      address: Yup.string().required("Please input the address!"),
      departmentId: Yup.number()
        .required("Please input the department ID!")
        .typeError("Department ID must be a number"),
      hourlyRate:
        wageType === "Hourly"
          ? Yup.number()
              .required("Please input the hourly rate!")
              .typeError("Hourly rate must be a number")
          : Yup.number().notRequired(),
      baseSalary:
        wageType === "Monthly"
          ? Yup.number()
              .required("Please input the base salary!")
              .typeError("Base salary must be a number")
          : Yup.number().notRequired(),
    }),
    onSubmit: async (values, { resetForm }) => {
      await f(values);
      try {
        let picturePath = null;
        if (pictureFile) {
          const pictureName = `${Date.now()}_${pictureFile.name}`;
          picturePath = `images/${pictureName}`;
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Image = e.target.result.split(",")[1];
            await invoke("upload_image", {
              fileName: pictureName,
              base64Content: base64Image,
            });
          };
          reader.readAsDataURL(pictureFile);
        }

        const result = await db.execute(
          "INSERT into employees (first_name, last_name, father_name, cnic, address, department_id, wage_type, hourly_rate, base_salary, date_of_joining, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
          [
            values.firstName,
            values.lastName,
            values.fatherName,
            values.cnic,
            values.address,
            values.departmentId,
            wageType,
            values.hourlyRate,
            values.baseSalary,
            new Date(),
            "Active",
          ]
        );
        if (result?.lastInsertId) {
          notification.success({
            message: "Employee Added",
            description: "The employee was successfully added to the database.",
          });

          resetForm();
          setPictureFile(null);
        } else {
          notification.error({
            message: "Error",
            description: "There was an error adding the employee.",
          });
        }
      } catch (error) {
        console.error("Error adding employee:", error);
        notification.error({
          message: "Error",
          description: "There was an error adding the employee.",
        });
      }
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      style={{ maxWidth: "400px", margin: "0 auto" }}
    >
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
        <label>Father Name</label>
        <Input
          name="fatherName"
          value={formik.values.fatherName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Enter employee father name"
        />
        {formik.touched.fatherName && formik.errors.fatherName && (
          <div style={{ color: "red", marginTop: "5px" }}>
            {formik.errors.fatherName}
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
          placeholder="Enter employee CNIC"
        />
        {formik.touched.cnic && formik.errors.cnic && (
          <div style={{ color: "red", marginTop: "5px" }}>
            {formik.errors.cnic}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>Address</label>
        <Input
          name="address"
          value={formik.values.address}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Enter employee address"
        />
        {formik.touched.address && formik.errors.address && (
          <div style={{ color: "red", marginTop: "5px" }}>
            {formik.errors.address}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>Department ID</label>
        <Input
          name="departmentId"
          type="number"
          value={formik.values.departmentId}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Enter department ID"
        />
        {formik.touched.departmentId && formik.errors.departmentId && (
          <div style={{ color: "red", marginTop: "5px" }}>
            {formik.errors.departmentId}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>Wage Type</label>
        <Select
          value={wageType}
          onChange={(value) => {
            setWageType(value);
            formik.setFieldValue("hourlyRate", "");
            formik.setFieldValue("baseSalary", "");
          }}
          style={{ width: "100%" }}
        >
          <Option value="Hourly">Hourly</Option>
          <Option value="Monthly">Monthly</Option>
        </Select>
      </div>

      {wageType === "Hourly" && (
        <div style={{ marginBottom: "16px" }}>
          <label>Hourly Rate</label>
          <Input
            name="hourlyRate"
            type="number"
            value={formik.values.hourlyRate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter hourly rate"
          />
          {formik.touched.hourlyRate && formik.errors.hourlyRate && (
            <div style={{ color: "red", marginTop: "5px" }}>
              {formik.errors.hourlyRate}
            </div>
          )}
        </div>
      )}

      {wageType === "Monthly" && (
        <div style={{ marginBottom: "16px" }}>
          <label>Base Salary</label>
          <Input
            name="baseSalary"
            type="number"
            value={formik.values.baseSalary}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter base salary"
          />
          {formik.touched.baseSalary && formik.errors.baseSalary && (
            <div style={{ color: "red", marginTop: "5px" }}>
              {formik.errors.baseSalary}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        {/* <label>Picture</label>
        <Upload
          beforeUpload={(file) => {
            setPictureFile(file);
            return false;
          }}
          onRemove={() => setPictureFile(null)}
          accept="image/*"
        >
          <Button>Select Picture</Button>
        </Upload> */}
        <PictureUpload />
      </div>

      <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
        Add Employee
      </Button>
    </form>
  );
};

export default AddEmployeeForm;
