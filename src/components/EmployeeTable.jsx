import React, { useEffect, useState } from "react";
import { Table, Avatar, notification } from "antd";
import { useDatabase } from "../context/DatabaseContext";

const EmployeeTable = () => {
  const db = useDatabase();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeData = await db.select("select * from employees");
        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching employees:", error);
        notification.error({
          message: "Error",
          description: "Failed to load employee data.",
        });
      }
    };

    fetchEmployees();
  }, []);

  const columns = [
    {
      title: "Avatar",
      dataIndex: "picture_path",
      key: "picture_path",
      render: (text) =>
        text ? (
          <Avatar src={text} alt="Avatar" style={{ width: 40, height: 40 }} />
        ) : (
          <Avatar style={{ backgroundColor: "#87d068" }}>N/A</Avatar>
        ),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "First Name",
      dataIndex: "first_name",
      key: "first_name",
    },
    {
      title: "Last Name",
      dataIndex: "last_name",
      key: "last_name",
    },
    {
      title: "Father Name",
      dataIndex: "father_name",
      key: "father_name",
    },
    {
      title: "CNIC",
      dataIndex: "cnic",
      key: "cnic",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Department ID",
      dataIndex: "department_id",
      key: "department_id",
    },
    {
      title: "Wage Type",
      dataIndex: "wage_type",
      key: "wage_type",
    },
    {
      title: "Hourly Rate",
      dataIndex: "hourly_rate",
      key: "hourly_rate",
      render: (text) => (text ? `$${text}` : "-"),
    },
    {
      title: "Base Salary",
      dataIndex: "base_salary",
      key: "base_salary",
      render: (text) => (text ? `$${text}` : "-"),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={employees}
        rowKey="id"
        pagination={false}
        style={{ marginTop: 20 }}
      />
    </div>
  );
};

export default EmployeeTable;
