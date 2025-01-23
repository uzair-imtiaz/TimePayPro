import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  notification,
  Select,
  DatePicker,
  Space,
  TimePicker,
} from "antd";
import { useDatabase } from "../context/DatabaseContext";
import dayjs from "dayjs";

const { Option } = Select;

const AttendanceTable = () => {
  const db = useDatabase();
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [status, setStatus] = useState("Present");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await db.select(
          "SELECT first_name, last_name, date, a.status, check_in_time, check_out_time FROM Attendance a INNER JOIN Employees e ON a.employee_id = e.id"
        );
        setAttendance(data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        notification.error({
          message: "Error",
          description: "Failed to load attendance data.",
        });
      }
    };

    const fetchEmployees = async () => {
      try {
        const employeesData = await db.select(
          "SELECT id, first_name, last_name FROM Employees"
        );
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchAttendance();
    fetchEmployees();
  }, []);

  const columns = [
    {
      title: "Employee Name",
      dataIndex: "employee_name",
      key: "employee_name",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Check-in Time",
      dataIndex: "check_in_time",
      key: "check_in_time",
    },
    {
      title: "Check-out Time",
      dataIndex: "check_out_time",
      key: "check_out_time",
    },
  ];

  const handleMarkAttendance = async () => {
    debugger;
    if (!selectedEmployee || !status || !date) {
      notification.error({
        message: "Error",
        description: "Please select all fields.",
      });
      return;
    }

    try {
      await db.execute(
        `
        INSERT INTO Attendance (employee_id, date, status, check_in_time, check_out_time)
        VALUES (?, ?, ?, ?, ?);
        `,
        [
          selectedEmployee,
          date,
          status,
          checkInTime.format("HH:mm"),
          checkOutTime.format("HH:mm"),
        ]
      );

      notification.success({
        message: "Success",
        description: "Attendance marked successfully.",
      });

      const updatedAttendance = await db.select(
        "SELECT * FROM Attendance a INNER JOIN Employees e ON a.employee_id = e.id"
      );
      setAttendance(updatedAttendance);
    } catch (error) {
      console.error("Error marking attendance:", error);
      notification.error({
        message: "Error",
        description: "Failed to mark attendance.",
      });
    }
  };

  return (
    <div>
      <h2>Attendance Table</h2>
      <Table
        columns={columns}
        dataSource={attendance.map((att) => ({
          ...att,
          employee_name: `${att.first_name} ${att.last_name}`,
        }))}
        rowKey="id"
        pagination={false}
        style={{ marginBottom: 20, overflow: "auto" }}
      />
      <h3>Mark Attendance</h3>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Select
          placeholder="Select Employee"
          value={selectedEmployee}
          onChange={(value) => {
            setSelectedEmployee(value);
          }}
          style={{ width: "25%" }}
        >
          {employees.map((emp) => (
            <Option key={emp.id} value={emp.id}>
              {emp.first_name} {emp.last_name}
            </Option>
          ))}
        </Select>
        <DatePicker
          value={dayjs(date)}
          onChange={(date) => setDate(date.format("YYYY-MM-DD"))}
          format="YYYY-MM-DD"
          style={{ width: "25%" }}
        />
        <Select
          value={status}
          onChange={(value) => setStatus(value)}
          style={{ width: "25%" }}
        >
          <Option value="Present">Present</Option>
          <Option value="Absent">Absent</Option>
          <Option value="Leave">Leave</Option>
        </Select>
        <TimePicker
          format="HH:mm"
          value={checkInTime}
          onChange={setCheckInTime}
          style={{ width: "25%" }}
          placeholder="Check-in Time"
        />
        <TimePicker
          format="HH:mm"
          value={checkOutTime}
          onChange={setCheckOutTime}
          placeholder="Check-out Time"
          style={{ width: "25%" }}
        />
        <Button type="primary" onClick={handleMarkAttendance}>
          Mark Attendance
        </Button>
      </Space>
    </div>
  );
};

export default AttendanceTable;
