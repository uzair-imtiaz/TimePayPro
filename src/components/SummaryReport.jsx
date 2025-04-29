import React, { useEffect, useState } from "react";
import { Table, notification, DatePicker, Button } from "antd";
import { useDatabase } from "../context/DatabaseContext";
import dayjs from "dayjs";
import { exportToExcel, getHourlySalary, getTax } from "../utils";
import dayjsBusinessDays from "dayjs-business-days";

const { MonthPicker } = DatePicker;

const SummaryReport = () => {
  dayjs.extend(dayjsBusinessDays);
  const db = useDatabase();
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    total_employees: 0,
    total_gross_salary: 0,
    total_net_salary: 0,
    total_tax: 0,
    total_advance: 0,
    total_allowance: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM")); // Default to the current month

  // const fetchSummaryReport = async (month) => {
  //   try {
  //     const data = await db.select(
  //       `
  //       SELECT
  //         department,
  //         COUNT(*) as total_employees,
  //         SUM(gross_salary) as total_gross_salary,
  //         SUM(advance) as total_advance,
  //         SUM(short_time) as total_short_time_amount
  //       FROM Salaries
  //       JOIN Employees ON Salaries.employee_id = Employees.id
  //       WHERE month = ?
  //       GROUP BY department
  //     `,
  //       [month]
  //     );

  //     const processedData = data.map((row) => {
  //       console.log("row", row);
  //       return {
  //         ...row,
  //         total_deduction:
  //           (row.total_advance || 0) + (row.total_short_time_amount || 0),
  //         total_net_salary:
  //           (row.total_gross_salary || 0) -
  //           getTax(row.department) -
  //           (row.total_advance || 0) +
  //           (row.total_allowance || 0),
  //       };
  //     });

  //     // Calculate totals for the footer row
  //     const totals = processedData.reduce(
  //       (acc, curr) => {
  //         acc.total_employees += curr.total_employees || 0;
  //         acc.total_gross_salary += curr.total_gross_salary || 0;
  //         acc.total_net_salary += curr.total_net_salary || 0;
  //         acc.total_advance += curr.total_advance || 0;
  //         acc.total_allowance += curr.total_allowance || 0;
  //         return acc;
  //       },
  //       {
  //         total_employees: 0,
  //         total_gross_salary: 0,
  //         total_net_salary: 0,
  //         total_advance: 0,
  //         total_allowance: 0,
  //       }
  //     );

  //     setSummaryData(processedData);
  //     setTotals(totals);
  //   } catch (error) {
  //     console.error("Error fetching summary report:", error);
  //     notification.error({
  //       message: "Error",
  //       description: "Failed to load summary report.",
  //     });
  //   }
  // };

  const fetchSummaryReport = async (month) => {
    try {
      setLoading(true);
      // Fetch individual employee data
      const data = await db.select(
        `
        SELECT 
          department,
          employee_id,
          base_salary,
          gross_salary,
          advance,
          allowance,
          short_time,
          leaves_used,
          overtime_hours_worked,
          overtime_rate,
          working_hours, 
          month
        FROM Salaries 
        JOIN Employees ON Salaries.employee_id = Employees.id 
        WHERE month = ?
      `,
        [month]
      );
      console.log("data", data);

      // Process each employee's data
      const processedData = data.map((row) => {
        // Calculate hourly salary
        const hourlySalary = getHourlySalary(
          row.base_salary + (row.allowance || 0),
          row.working_hours,
          row.month
        );
        console.log("hourlySalary", hourlySalary);

        // Calculate deductions and net salary for individual employees
        const tax = getTax(row.department, row.designation);
        console.log("tax", tax);
        const netSalary =
          (row.gross_salary || 0) -
          tax -
          (row.advance || 0) +
          (row.allowance || 0) +
          (row.overtime_hours_worked || 0) *
            (row.overtime_rate || 0) *
            hourlySalary -
          (row.short_time || 0) * hourlySalary;
        console.log(
          "overtime",
          (row.overtime_hours_worked || 0) *
            (row.overtime_rate || 0) *
            hourlySalary
        );
        const totalDeduction =
          (row.advance || 0) + (row.short_time || 0) * hourlySalary + tax;

        return {
          ...row,
          net_salary: netSalary,
          total_deduction: totalDeduction,
        };
      });

      // Group data by department and calculate totals for each department
      const groupedData = processedData.reduce((acc, curr) => {
        const department = curr.department;
        if (!acc[department]) {
          acc[department] = {
            total_employees: 0,
            total_gross_salary: 0,
            total_net_salary: 0,
            total_deduction: 0,
          };
        }

        acc[department].total_employees += 1;
        acc[department].total_gross_salary += curr.gross_salary || 0;
        acc[department].total_net_salary += curr.net_salary || 0;
        acc[department].total_deduction += curr.total_deduction || 0;

        return acc;
      }, {});

      const finalData = Object.keys(groupedData).map((department) => ({
        department,
        ...groupedData[department],
      }));

      setSummaryData(finalData);

      // Calculate overall totals for the footer row, ensuring they match processedData
      const totals = {
        total_employees: processedData.length,
        total_gross_salary: processedData.reduce(
          (acc, curr) => acc + (curr.gross_salary || 0),
          0
        ),
        total_net_salary: processedData.reduce(
          (acc, curr) => acc + (curr.net_salary || 0),
          0
        ),
        total_deduction: processedData.reduce(
          (acc, curr) => acc + (curr.total_deduction || 0),
          0
        ),
      };

      setTotals(totals);
    } catch (error) {
      console.error("Error fetching summary report:", error);
      notification.error({
        message: "Error",
        description: "Failed to load summary report.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryReport(selectedMonth);
  }, [selectedMonth]);

  const handleMonthChange = (date, dateString) => {
    setSelectedMonth(dateString);
  };

  console.log("summaryData", summaryData);

  const columns = [
    { title: "Department", dataIndex: "department", key: "department" },
    {
      title: "Total Employees",
      dataIndex: "total_employees",
      key: "total_employees",
    },
    {
      title: "Payable Amount",
      dataIndex: "total_gross_salary",
      key: "total_gross_salary",
      render: (text) => text?.toFixed(2),
    },
    {
      title: "Deductions",
      dataIndex: "total_deduction",
      key: "total_deduction",
      render: (text) => text?.toFixed(2),
    },
    {
      title: "Net Payable",
      dataIndex: "total_net_salary",
      key: "total_net_salary",
      render: (text) => text?.toFixed(2),
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
                total_deduction: totals.total_deduction,
                total_net_salary: totals.total_net_salary,
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
        loading={loading}
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
              <strong>{totals.total_gross_salary?.toFixed(2)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3}>
              <strong>{totals.total_deduction?.toFixed(2)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4}>
              <strong>{totals.total_net_salary?.toFixed(2)}</strong>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </div>
  );
};

export default SummaryReport;
