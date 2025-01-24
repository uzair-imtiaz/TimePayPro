import React, { useState, useEffect } from "react";
import { Row, Col, Card, Statistic, Badge, Table } from "antd";
import { useParams } from "react-router-dom";
import { useDatabase } from "../context/DatabaseContext";
import Calendar from "../components/Calender";
import { Image } from "antd";
const EmployeeDetail = () => {
  const { id } = useParams();
  const db = useDatabase();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({
    leavesUsed: 0,
    advance: 0,
    tax: 0,
    overtime: 0,
    netSalary: 0,
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
          `SELECT tax, advance, overtime_hours_worked, gross_salary, net_salary, leaves_used FROM Salaries WHERE employee_id = ? AND month = strftime('%Y-%m', 'now');`,
          [id]
        );

        setSummary({
          leavesUsed: summaryData.leaves_used,
          advance: summaryData.advance || 0,
          overtime: summaryData.overtime_hours_worked || 0,
          tax: employee.base_salary >= 500000 ? base_salary * 0.2275 : 0,
          grossSalary: summaryData.gross_salary || 0,
        });
      } catch (error) {
        console.error("Error fetching employee details:", error);
      }
    };

    fetchDetails();
  }, [id, db]);

  if (!employee) {
    return <div>Loading...</div>;
  }

  const netSalary =
    (summary.grossSalary ?? 0) -
    (summary.tax ?? 0) -
    (summary.advance ?? 0) +
    (employee.allowance ?? 0);

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
              <strong>Base Salary:</strong> {employee.base_salary}
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
                  value={employee.leaves_allotted}
                />
              </Col>
              <Col span={8}>
                <Statistic title="Advance" value={`${summary.advance}`} />
              </Col>
              <Col span={8}>
                <Statistic title="Overtime Hours" value={summary.overtime} />
              </Col>
              <Col span={8}>
                <Statistic title="Allowance" value={`${employee.allowance}`} />
              </Col>
              <Col span={8}>
                <Statistic title="Tax" value={`${summary.tax}`} />
              </Col>
              {/* <Col span={8}>
                <Statistic title="Net Salary" value={netSalary} />
              </Col> */}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        {/* Attendance Calendar */}
        <Col span={12}>
          <Card title="Attendance Calendar" bordered>
            <Calendar attendanceData={attendance} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Documents" bordered>
            <Row gutter={[16, 16]}>
              {employee.picture_path && (
                <Col span={12}>
                  <h4>Profile Picture</h4>
                  <Image
                    src={`../../src-tauri/${employee.picture_path}`}
                    alt="Employee Profile"
                    style={{
                      width: "100%",
                      maxHeight: "200px",
                      objectFit: "cover",
                    }}
                  />
                </Col>
              )}
              {employee.cnic_image_path && (
                <Col span={12}>
                  <h4>CNIC Image</h4>
                  <Image
                    src={`../../src-tauri/${employee.cnic_image_path}`}
                    alt="CNIC"
                    style={{
                      width: "100%",
                      maxHeight: "200px",
                      objectFit: "cover",
                    }}
                  />
                </Col>
              )}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDetail;
