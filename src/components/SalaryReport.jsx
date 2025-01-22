import React, { useEffect, useState } from "react";
import { Table, notification, DatePicker, Button } from "antd";
import { useDatabase } from "../context/DatabaseContext";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const SalaryReport = () => {
  const db = useDatabase();
  const [salaryData, setSalaryData] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [loading, setLoading] = useState(false);

  const fetchSalaryReport = async (startDate, endDate) => {
    try {
      setLoading(true);
      const data = await db.select(
        `
            SELECT
              Employees.id as employee_id,
              Employees.first_name,
              Employees.last_name,
              Employees.department,
              Salaries.gross_salary,
              Salaries.tax,
              Salaries.advance,
              Salaries.overtime_hours_worked,
              Salaries.net_salary
            FROM Salaries
            JOIN Employees ON Salaries.employee_id = Employees.id
            WHERE Salaries.month BETWEEN ? AND ?
            ORDER BY Employees.department, Employees.id
          `,
        [startDate.format("YYYY-MM"), endDate.format("YYYY-MM")]
      );

      console.log("data", data);
      setSalaryData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching salary report:", error);
      notification.error({
        message: "Error",
        description: "Failed to load salary report.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data for the default time frame (current month)
    fetchSalaryReport(dateRange[0], dateRange[1]);
  }, []);

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
    }
  };

  const handleFilter = () => {
    fetchSalaryReport(dateRange[0], dateRange[1]);
  };

  const columns = [
    {
      title: "Employee ID",
      dataIndex: "employee_id",
      key: "employee_id",
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
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Gross Salary",
      dataIndex: "gross_salary",
      key: "gross_salary",
      render: (value) => `$${value?.toFixed(2)}`,
    },
    {
      title: "Tax",
      dataIndex: "tax",
      key: "tax",
      render: (value) => `$${value?.toFixed(2)}`,
    },
    {
      title: "Advance",
      dataIndex: "advance",
      key: "advance",
      render: (value) => `$${value?.toFixed(2)}`,
    },
    {
      title: "Overtime Hours Worked",
      dataIndex: "overtime_hours_worked",
      key: "overtime_hours_worked",
    },
    {
      title: "Net Salary",
      dataIndex: "net_salary",
      key: "net_salary",
      render: (value) => `$${value?.toFixed(2)}`,
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Salary Report</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <RangePicker
          onChange={handleDateChange}
          defaultValue={dateRange}
          format="YYYY-MM"
          picker="month"
          disabledDate={(current) =>
            current && current > dayjs().endOf("month")
          }
        />
        <Button type="primary" onClick={handleFilter} loading={loading}>
          Filter
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={salaryData}
        rowKey="employee_id"
        pagination={{ pageSize: 10 }}
        bordered
        loading={loading}
      />
    </div>
  );
};

export default SalaryReport;
