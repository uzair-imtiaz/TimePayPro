import React, { useEffect, useState } from "react";
import { Table, notification, DatePicker, Button, Select, Input } from "antd";
import { useDatabase } from "../context/DatabaseContext";
import { departments } from "../constants/departments";
import dayjs from "dayjs";
import dayjsBusinessDays from "dayjs-business-days";
import { exportToExcel, getHourlySalary, getTax } from "../utils";

dayjs.extend(dayjsBusinessDays);

const { RangePicker } = DatePicker;
const { Option } = Select;

const SalaryReport = () => {
  const db = useDatabase();
  const [salaryData, setSalaryData] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
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
              Employees.designation,
              Employees.allowance,
              Employees.overtime_rate,
              Employees.working_hours,
              Employees.base_salary,
              Salaries.gross_salary,
              Salaries.advance,
              Salaries.month,
              Salaries.overtime_hours_worked,
              Salaries.short_time
            FROM Salaries
            JOIN Employees ON Salaries.employee_id = Employees.id
            WHERE Salaries.month BETWEEN ? AND ?
            AND (? IS NULL OR Employees.department = ?)
            AND (? = '' OR Employees.first_name LIKE '%' || ? || '%' OR Employees.last_name LIKE '%' || ? || '%')
            ORDER BY Employees.department, Employees.id
          `,
        [
          startDate.format("YYYY-MM"),
          endDate.format("YYYY-MM"),
          selectedDepartment,
          selectedDepartment,
          employeeSearch,
          employeeSearch,
          employeeSearch,
        ]
      );

      console.log(data[0]);

      const processedData = data.map((row) => {
        const hourlySalary =
          getHourlySalary(
            row.base_salary,
            row.working_hours,
            dayjs(row.month).businessDaysInMonth()
          ) || 0;
        return {
          ...row,
          overtime_hours_worked:
            (row.overtime_hours_worked || 0) *
            (row.overtime_rate || 0) *
            hourlySalary,
          short_time_amount: (row.short_time || 0) * hourlySalary,
          tax: getTax(row.department, row.designation),
          net_salary:
            (row.gross_salary || 0) -
            getTax(row.department, row.designation) -
            (row.advance || 0) +
            (row.allowance || 0) +
            (row.overtime_hours_worked || 0) * 1000 -
            (row.short_time || 0) * hourlySalary,
          total_deduction:
            (row.advance || 0) +
            (row.short_time || 0) * hourlySalary +
            getTax(row.department, row.designation),
        };
      });

      setSalaryData(processedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching detailed report:", error);
      notification.error({
        message: "Error",
        description: "Failed to load detailed report.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
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
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
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
      render: (value) => `${value?.toFixed(2)}`,
    },
    {
      title: "Tax",
      dataIndex: "tax",
      key: "tax",
      render: (value) => `${value?.toFixed(2)}`,
    },
    {
      title: "Advance",
      dataIndex: "advance",
      key: "advance",
      render: (value) => `-${value?.toFixed(2)}`,
    },
    {
      title: "Short Time Amount",
      dataIndex: "short_time_amount",
      key: "short_time_amount",
      render: (value) => `-${value?.toFixed(2)}`,
    },
    {
      title: "Allowance",
      dataIndex: "allowance",
      key: "allowance",
      render: (value) => `${value?.toFixed(2)}`,
    },
    {
      title: "Overtime Amount",
      dataIndex: "overtime_hours_worked",
      key: "overtime_hours_worked",
      render: (value) => `${value?.toFixed(2)}`,
    },
    {
      title: "Total Deduction",
      dataIndex: "total_deduction",
      key: "total_deduction",
      render: (value) => `${value?.toFixed(2)}`,
    },
    {
      title: "Net Salary",
      dataIndex: "net_salary",
      key: "net_salary",
      render: (value) => `${value?.toFixed(2)}`,
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Detailed Report</h2>
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

        <Select
          placeholder="Select Department"
          onChange={(value) => setSelectedDepartment(value)}
          allowClear
          style={{ width: "200px" }}
        >
          {departments.map((dept) => (
            <Option key={dept.id} value={dept.name}>
              {dept.name}
            </Option>
          ))}
        </Select>

        <Input
          placeholder="Search Employee"
          value={employeeSearch}
          onChange={(e) => setEmployeeSearch(e.target.value)}
          style={{ width: "200px" }}
        />

        <Button type="primary" onClick={handleFilter} loading={loading}>
          Filter
        </Button>
        <Button
          onClick={() =>
            exportToExcel(
              salaryData,
              columns,
              `Salary_Report_${dateRange[0]}.xlsx`
            )
          }
          type="primary"
        >
          Export Report
        </Button>
      </div>

      <Table
        scroll={{ x: 1000 }}
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
