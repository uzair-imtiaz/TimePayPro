import React, { useState, useEffect } from "react";
import { Table, Select, notification } from "antd";
import { useDatabase } from "../context/DatabaseContext";
import { departments } from "../constants/departments";

const { Option } = Select;

const DetailedReport = () => {
  const db = useDatabase();
  const [selectedDepartment, setSelectedDepartment] = useState(
    departments[0]?.name
  );
  const [detailedData, setDetailedData] = useState([]);

  useEffect(() => {
    const fetchDetailedReport = async () => {
      try {
        const data = await db.select(
          `
          SELECT 
            Employees.first_name, 
            Employees.last_name, 
            Salaries.gross_salary, 
            Salaries.net_salary, 
            Salaries.tax, 
            Salaries.advance, 
            Salaries.overtime_hours_worked 
          FROM Salaries 
          JOIN Employees ON Salaries.employee_id = Employees.id 
          WHERE Employees.department = ? AND month = strftime('%Y-%m', 'now')
        `,
          [selectedDepartment]
        );
        setDetailedData(data);
      } catch (error) {
        console.error("Error fetching detailed report:", error);
        notification.error({
          message: "Error",
          description: "Failed to load detailed report.",
        });
      }
    };

    if (selectedDepartment) fetchDetailedReport();
  }, [db, selectedDepartment]);

  const columns = [
    { title: "First Name", dataIndex: "first_name", key: "first_name" },
    { title: "Last Name", dataIndex: "last_name", key: "last_name" },
    { title: "Gross Salary", dataIndex: "gross_salary", key: "gross_salary" },
    { title: "Net Salary", dataIndex: "net_salary", key: "net_salary" },
    { title: "Tax", dataIndex: "tax", key: "tax" },
    { title: "Advance", dataIndex: "advance", key: "advance" },
    {
      title: "Overtime Hours",
      dataIndex: "overtime_hours_worked",
      key: "overtime_hours_worked",
    },
  ];

  return (
    <div>
      <Select
        value={selectedDepartment}
        onChange={(value) => setSelectedDepartment(value)}
        style={{ marginBottom: 20, width: "100%" }}
      >
        {departments.map((dept) => (
          <Option key={dept.id} value={dept.name}>
            {dept.name}
          </Option>
        ))}
      </Select>
      <Table columns={columns} dataSource={detailedData} rowKey="first_name" />
    </div>
  );
};

export default DetailedReport;
