import React, { useEffect, useState } from "react";
import { Table, notification } from "antd";
import { useDatabase } from "../context/DatabaseContext";

const SummaryReport = () => {
  const db = useDatabase();
  const [summaryData, setSummaryData] = useState([]);

  useEffect(() => {
    const fetchSummaryReport = async () => {
      try {
        const data = await db.select(`
          SELECT 
            department,
            COUNT(*) as total_employees, 
            SUM(gross_salary) as total_gross_salary, 
            SUM(net_salary) as total_net_salary, 
            SUM(tax) as total_tax, 
            SUM(advance) as total_advance 
          FROM Salaries 
          JOIN Employees ON Salaries.employee_id = Employees.id 
          WHERE month = strftime('%Y-%m', 'now') 
          GROUP BY department
        `);
        setSummaryData(data);
      } catch (error) {
        console.error("Error fetching summary report:", error);
        notification.error({
          message: "Error",
          description: "Failed to load summary report.",
        });
      }
    };

    fetchSummaryReport();
  }, [db]);

  console.log("summaryData", summaryData);

  const columns = [
    { title: "Department", dataIndex: "department", key: "department" },
    {
      title: "Total Employees",
      dataIndex: "total_employees",
      key: "total_employees",
    },
    {
      title: "Gross Salary",
      dataIndex: "total_gross_salary",
      key: "total_gross_salary",
    },
    {
      title: "Net Salary",
      dataIndex: "total_net_salary",
      key: "total_net_salary",
    },
    { title: "Total Tax", dataIndex: "total_tax", key: "total_tax" },
    {
      title: "Total Advance",
      dataIndex: "total_advance",
      key: "total_advance",
    },
  ];

  return (
    <Table columns={columns} dataSource={summaryData} rowKey="department" />
  );
};

export default SummaryReport;
