import React, { useEffect, useState } from "react";
import { Table, notification, DatePicker, Button } from "antd";
import { useDatabase } from "../context/DatabaseContext";
import dayjs from "dayjs";
import { exportToExcel, getTax } from "../utils";

const { MonthPicker } = DatePicker;

const SummaryReport = () => {
  const db = useDatabase();
  const [summaryData, setSummaryData] = useState([]);
  const [totals, setTotals] = useState({
    total_employees: 0,
    total_gross_salary: 0,
    total_net_salary: 0,
    total_tax: 0,
    total_advance: 0,
    total_allowance: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM")); // Default to the current month

  const fetchSummaryReport = async (month) => {
    try {
      const data = await db.select(
        `
        SELECT 
          department,
          COUNT(*) as total_employees, 
          SUM(gross_salary) as total_gross_salary, 
          SUM(advance) as total_advance,
          SUM(short_time) as total_short_time_amount
        FROM Salaries 
        JOIN Employees ON Salaries.employee_id = Employees.id 
        WHERE month = ?
        GROUP BY department
      `,
        [month]
      );

      const processedData = data.map((row) => ({
        ...row,
        total_deduction:
          (row.total_advance || 0) + (row.total_short_time_amount || 0),
        total_net_salary:
          (row.total_gross_salary || 0) -
          getTax(row.department) -
          (row.total_advance || 0) +
          (row.total_allowance || 0),
      }));

      // Calculate totals for the footer row
      const totals = processedData.reduce(
        (acc, curr) => {
          acc.total_employees += curr.total_employees || 0;
          acc.total_gross_salary += curr.total_gross_salary || 0;
          acc.total_net_salary += curr.total_net_salary || 0;
          acc.total_advance += curr.total_advance || 0;
          acc.total_allowance += curr.total_allowance || 0;
          return acc;
        },
        {
          total_employees: 0,
          total_gross_salary: 0,
          total_net_salary: 0,
          total_advance: 0,
          total_allowance: 0,
        }
      );

      setSummaryData(processedData);
      setTotals(totals);
    } catch (error) {
      console.error("Error fetching summary report:", error);
      notification.error({
        message: "Error",
        description: "Failed to load summary report.",
      });
    }
  };

  useEffect(() => {
    fetchSummaryReport(selectedMonth);
  }, [selectedMonth]);

  const handleMonthChange = (date, dateString) => {
    setSelectedMonth(dateString);
  };

  const columns = [
    { title: "Department", dataIndex: "department", key: "department" },
    {
      title: "Total Employees",
      dataIndex: "total_employees",
      key: "total_employees",
    },
    {
      title: "Payable Amount",
      dataIndex: "total_net_salary",
      key: "total_net_salary",
    },
    {
      title: "Deductions",
      dataIndex: "total_deduction",
      key: "total_deduction",
    },
    {
      title: "Net Payable",
      dataIndex: "total_net_salary",
      key: "total_net_salary",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Summary Report</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <MonthPicker
          onChange={handleMonthChange}
          picker="month"
          defaultValue={dayjs()}
          format="YYYY-MM"
        />
        <Button
          onClick={() => {
            const dataWithTotals = [
              ...summaryData,
              {
                department: "Total",
                total_employees: totals.total_employees,
                total_gross_salary: totals.total_gross_salary,
                total_net_salary: totals.total_net_salary,
                total_advance: totals.total_advance,
                total_allowance: totals.total_allowance,
              },
            ];
            exportToExcel(
              dataWithTotals,
              columns,
              `Summary_Report_${selectedMonth}.xlsx`
            );
          }}
          type="primary"
        >
          Export Report
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={summaryData}
        rowKey="department"
        pagination={false}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}>
              <strong>Total</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1}>
              <strong>{totals.total_employees}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2}>
              <strong>{totals.total_gross_salary.toFixed(2)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3}>
              <strong>{totals.total_net_salary.toFixed(2)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4}>
              <strong>{totals.total_advance.toFixed(2)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6}>
              <strong>{totals.total_allowance.toFixed(2)}</strong>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </div>
  );
};

export default SummaryReport;
