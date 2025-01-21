import React, { useState, useEffect } from "react";
import { Row, Col, Card, Statistic, Badge, Table } from "antd";
import { useParams } from "react-router-dom";
import { useDatabase } from "../context/DatabaseContext";
// import "./calendar.css";
import Calendar from "../components/Calender";

const EmployeeDetail = () => {
  const { id } = useParams(); // Get employee ID from route params
  const db = useDatabase();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({
    leavesUsed: 0,
    leavesAllotted: 0,
    deductions: 0,
    bonuses: 0,
    overtime: 0,
    allowances: 0,
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fetch Employee Details
        const [employeeData] = await db.select(
          `SELECT * FROM employees WHERE id = ?`,
          [id]
        );
        setEmployee(employeeData);

        // Fetch Attendance
        const attendanceData = await db.select(
          `SELECT date, status FROM attendance WHERE employee_id = ?`,
          [id]
        );
        setAttendance(
          attendanceData.map((att) => ({
            date: att.date,
            status: att.status,
          }))
        );

        // Fetch Summary
        const [summaryData] = await db.select(
          `SELECT SUM(deductions) as deductions, SUM(bonuses) as bonuses, 
           SUM(overtime_hours) as overtime, SUM(allowances) as allowances 
           FROM salaries WHERE employee_id = ?`,
          [id]
        );

        const [leavesData] = await db.select(
          `SELECT COUNT(*) as leavesUsed FROM attendance WHERE employee_id = ? AND status = 'Leave'`,
          [id]
        );

        setSummary({
          leavesUsed: leavesData.leavesUsed,
          leavesAllotted: employeeData ? employeeData.leaves_allotted || 0 : 0,
          deductions: summaryData.deductions || 0,
          bonuses: summaryData.bonuses || 0,
          overtime: summaryData.overtime || 0,
          allowances: summaryData.allowances || 0,
        });
      } catch (error) {
        console.error("Error fetching employee details:", error);
      }
    };

    fetchDetails();
  }, [id, db]);

  const sampleAttendanceData = [
    { date: "2025-01-02", status: "Present" },
    { date: "2025-01-03", status: "Absent" },
    { date: "2025-01-05", status: "Leave" },
  ];

  const getListData = (value) => {
    const dateString = value.format("YYYY-MM-DD");
    const attendanceRecord = attendance.find((att) => att.date === dateString);

    if (attendanceRecord) {
      return [
        {
          type:
            attendanceRecord.status === "Present"
              ? "success"
              : attendanceRecord.status === "Absent"
              ? "error"
              : "warning",
          content: attendanceRecord.status,
        },
      ];
    }
    return [];
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  if (!employee) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Employee Information" bordered>
            <p>
              <strong>Name:</strong>{" "}
              {`${employee.first_name} ${employee.last_name}`}
            </p>
            <p>
              <strong>Department:</strong> {employee.department}
            </p>
            <p>
              <strong>Wage Type:</strong> {employee.wage_type}
            </p>
            <p>
              <strong>CNIC:</strong> {employee.cnic}
            </p>
            <p>
              <strong>Address:</strong> {employee.address}
            </p>
          </Card>
        </Col>

        {/* Summary */}
        <Col span={16}>
          <Card title="Summary" bordered>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic title="Leaves Used" value={summary.leavesUsed} />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Leaves Allotted"
                  value={summary.leavesAllotted}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Deductions"
                  value={`$${summary.deductions}`}
                />
              </Col>
              <Col span={8}>
                <Statistic title="Bonuses" value={`$${summary.bonuses}`} />
              </Col>
              <Col span={8}>
                <Statistic title="Overtime Hours" value={summary.overtime} />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Allowances"
                  value={`$${summary.allowances}`}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        {/* Attendance Calendar */}
        <Col span={12}>
          <Card title="Attendance Calendar" bordered>
            <Calendar attendanceData={sampleAttendanceData} />
          </Card>
        </Col>

        {/* Attendance Table */}
        <Col span={12}>
          <Card title="Attendance Details" bordered>
            <Table
              columns={[
                { title: "Date", dataIndex: "date", key: "date" },
                { title: "Status", dataIndex: "status", key: "status" },
              ]}
              dataSource={attendance.map((att, index) => ({
                key: index,
                date: att.date,
                status: att.status,
              }))}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDetail;
