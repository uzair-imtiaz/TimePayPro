import { EditOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Modal,
  notification,
  Select,
  Space,
  Table,
  TimePicker,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { countWorkingDays, getHourlySalary } from "../utils";

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
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchAttendance = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const offset = (page - 1) * pageSize;
      const data = await db.select(
        `SELECT e.id as employee_id, a.id, e.first_name, e.last_name, a.date, a.status, a.check_in_time, a.check_out_time 
        FROM Attendance a INNER JOIN Employees e ON a.employee_id = e.id order by a.date desc
        LIMIT ? OFFSET ?`,
        [pageSize, offset]
      );
      const total = await db.select(
        "SELECT COUNT(*) AS total FROM Attendance;"
      );
      setAttendance(data);
      setPagination((prev) => ({
        ...prev,
        total: total[0]?.total || 0,
        current: page,
        pageSize,
      }));
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      notification.error({
        message: "Error",
        description: "Failed to load attendance data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesData = await db.select(
          "SELECT id, first_name, last_name FROM Employees"
        );
        setEmployees(
          employeesData.map((emp) => {
            return {
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name} (${emp.id})`,
            };
          })
        );
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchAttendance(pagination.current, pagination.pageSize);
    fetchEmployees();
  }, []);

  const handleMarkCheckIn = async () => {
    if (!selectedEmployee || !status || !date) {
      notification.error({
        message: "Error",
        description: "Please select all fields.",
      });
      return;
    }

    try {
      if (status === "Leave" || status === "Absent") {
        await db.execute(
          `
          INSERT INTO Attendance (employee_id, date, status, check_in_time, check_out_time)
          VALUES (?, ?, ?, NULL, NULL)
          ON CONFLICT(employee_id, date)
          DO UPDATE SET status = ?, check_in_time = NULL, check_out_time = NULL;
          `,
          [selectedEmployee, date, status, status]
        );

        const employeeData = await db.select(
          "SELECT leaves_allotted, working_hours FROM Employees WHERE id = ?",
          [selectedEmployee]
        );

        if (!employeeData.length) {
          console.error(error);
          notification.error({
            message: "Error",
            description: "Failed to fetch employee data.",
          });
          return;
        }

        const allottedLeaves = employeeData[0].leaves_allotted;

        const leaveCountData = await db.select(
          `
          SELECT COUNT(*) as totalLeaves
          FROM Attendance
          WHERE employee_id = ? AND status IN ('Leave', 'Absent') AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now');
          `,
          [selectedEmployee]
        );

        const totalLeaves = leaveCountData[0].totalLeaves;

        const excessLeaves = Math.max(totalLeaves - allottedLeaves, 0);
        const shortTime = excessLeaves * employeeData[0].working_hours;
        await db.execute(
          `
          INSERT INTO Salaries (employee_id, month, leaves_used, gross_salary, net_salary, short_time)
          VALUES (?, strftime('%Y-%m', 'now'), 1, 0, 0, ?)
          ON CONFLICT(employee_id, month)
          DO UPDATE SET 
            leaves_used = leaves_used + 1,
            short_time = ?;
          `,
          [selectedEmployee, shortTime]
        );

        notification.success({
          message: "Success",
          description: "Leave/Absent marked successfully.",
        });
      } else {
        if (!checkInTime) {
          notification.error({
            message: "Error",
            description: "Please select a check-in time.",
          });
          return;
        }

        await db.execute(
          `
          INSERT INTO Attendance (employee_id, date, status, check_in_time, check_out_time)
          VALUES (?, ?, ?, ?, NULL)
          ON CONFLICT(employee_id, date)
          DO UPDATE SET status = ?, check_in_time = ?;
          `,
          [
            selectedEmployee,
            date,
            status,
            checkInTime.format("HH:mm"),
            status,
            checkInTime.format("HH:mm"),
          ]
        );

        notification.success({
          message: "Success",
          description: "Check-in time marked successfully.",
        });
      }

      await fetchAttendance();
    } catch (error) {
      console.error("Error marking attendance:", error);
      notification.error({
        message: "Error",
        description: "Failed to mark attendance.",
      });
    }
  };

  const handleMarkCheckOut = async (record) => {
    if (!checkOutTime) {
      notification.error({
        message: "Error",
        description: "Please select a check-out time.",
      });
      return;
    }

    try {
      const checkInTime = dayjs(
        `${date} ${record.check_in_time}`,
        "YYYY-MM-DD HH:mm"
      );
      await db.execute(
        `
        UPDATE Attendance
        SET check_out_time = ?
        WHERE id = ?;
        `,
        [checkOutTime?.format("HH:mm"), record.id]
      );

      const employeeData = await db.select(
        "SELECT base_salary, overtime_rate, working_hours, allowance FROM Employees WHERE id = ?",
        [record.employee_id]
      );

      if (!employeeData.length) {
        notification.error({
          message: "Error",
          description: "Failed to fetch employee data.",
        });
        return;
      }

      const {
        base_salary: baseSalary,
        overtime_rate: overtimeRate,
        working_hours: workingHours,
        allowance,
      } = employeeData[0];

      const hoursWorked = dayjs(checkOutTime).diff(
        dayjs(checkInTime),
        "hours",
        true
      );

      if (hoursWorked < 0) {
        hoursWorked += 24;
      }

      const currentMonth = dayjs(record.date).format("YYYY-MM");

      const dailySalary =
        (baseSalary + allowance) /
        (workingHours === 24
          ? dayjs(currentMonth).daysInMonth()
          : countWorkingDays(currentMonth));

      console.log(
        "Math.min(hoursWorked / workingHours, 1);",
        Math.min(hoursWorked / workingHours, 1)
      );

      console.log("dailySalary", dailySalary);

      const overtimeHours =
        Math.round(Math.max(hoursWorked - workingHours, 0) * 100) / 100;

      const shortTime =
        Math.round(Math.max(workingHours - hoursWorked, 0) * 100) / 100;

      const overtimePay =
        overtimeHours *
        overtimeRate *
        getHourlySalary(baseSalary, workingHours, currentMonth);

      const shortTimeDeduction =
        Math.min(hoursWorked / workingHours, 1) * dailySalary;

      console.log("shortTime", shortTime);
      console.log("shortTimeDeduction", shortTimeDeduction);

      const totalPay =
        shortTime > 0
          ? dailySalary - shortTimeDeduction
          : dailySalary + overtimePay;
      // need to calc short time
      await db.execute(
        `
        INSERT INTO Salaries (employee_id, month, gross_salary, net_salary, overtime_hours_worked, short_time)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(employee_id, month)
        DO UPDATE SET
          gross_salary = excluded.gross_salary,
          net_salary = excluded.net_salary,
          overtime_hours_worked = excluded.overtime_hours_worked,
          short_time = excluded.short_time;
        `,
        [
          record.employee_id,
          currentMonth,
          dailySalary,
          totalPay,
          overtimeHours,
          shortTime,
        ]
      );

      await fetchAttendance(pagination.current, pagination.pageSize);

      notification.success({
        message: "Success",
        description: "Check-out time and salary updated successfully.",
      });
    } catch (error) {
      console.error("Error updating check-out:", error);
      notification.error({
        message: "Error",
        description: "Failed to update check-out time and salary.",
      });
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setStatus(record.status);
    setCheckInTime(
      record.check_in_time ? dayjs(record.check_in_time, "HH:mm") : null
    );
    setCheckOutTime(
      record.check_out_time ? dayjs(record.check_out_time, "HH:mm") : null
    );
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      // find some way to add the encashed laves ./
      console.log(editingRecord);
      const currentMonth = dayjs(editingRecord.date).format("YYYY-MM");
      const employeeData = await db.select(
        "SELECT base_salary, overtime_rate, working_hours, leaves_allotted FROM Employees WHERE id = ?",
        [editingRecord.employee_id]
      );

      if (!employeeData.length) {
        notification.error({
          message: "Error",
          description: "Failed to fetch employee data.",
        });
        return;
      }

      const {
        base_salary: baseSalary,
        overtime_rate: overtimeRate,
        working_hours: workingHours,
        leaves_allotted: allottedLeaves,
      } = employeeData[0];

      // First update the attendance record
      if (status === "Leave" || status === "Absent") {
        await db.execute(
          `UPDATE Attendance 
           SET status = ?, check_in_time = NULL, check_out_time = NULL
           WHERE id = ?`,
          [status, editingRecord.id]
        );
      } else {
        if (!checkInTime) {
          notification.error({
            message: "Error",
            description: "Please select a check-in time.",
          });
          return;
        }

        await db.execute(
          `UPDATE Attendance 
           SET status = ?, 
               check_in_time = ?,
               check_out_time = ?
           WHERE id = ?`,
          [
            status,
            checkInTime.format("HH:mm"),
            checkOutTime?.format("HH:mm") || null,
            editingRecord.id,
          ]
        );
      }

      // Get all attendance records for the month to recalculate total salary
      const monthlyAttendance = await db.select(
        `SELECT * FROM Attendance 
         WHERE employee_id = ? 
         AND strftime('%Y-%m', date) = ?`,
        [editingRecord.employee_id, currentMonth]
      );

      console.log('monthlyAttendance', monthlyAttendance)

      let monthlyTotalPay = 0;
      let monthlyOvertimeHours = 0;
      let totalLeaves = 0;

      const daysInMonth = dayjs(editingRecord.date).daysInMonth();

      for (const record of monthlyAttendance) {
        if (
          record.status === "Present" &&
          record.check_in_time &&
          record.check_out_time
        ) {
          const recordCheckIn = dayjs(record.check_in_time, "HH:mm");
          const recordCheckOut = dayjs(record.check_out_time, "HH:mm");
          // Handle potential negative time difference (if check-out is before check-in on 24h format)
          let recordHoursWorked = recordCheckOut.diff(
            recordCheckIn,
            "hours",
            true
          );
          if (recordHoursWorked < 0) {
            // Assume checkout is next day if negative hours
            recordHoursWorked += 24;
          }

          // Calculate base pay (capped at regular working hours)
          const workingDaysCount =
            workingHours === 24 ? daysInMonth : countWorkingDays(currentMonth);
          const recordDailySalary =
            (baseSalary / workingDaysCount)
            // * Math.min(recordHoursWorked / workingHours, 1);

            const recordOvertimeHours =
            Math.round(Math.max(recordHoursWorked - workingHours, 0) * 100) / 100;

          const hourlyRate = getHourlySalary(
            baseSalary,
            workingHours,
            currentMonth
          );
          const recordOvertimePay =
            recordOvertimeHours * overtimeRate * hourlyRate;

          monthlyTotalPay += recordDailySalary + recordOvertimePay;
          monthlyOvertimeHours += recordOvertimeHours;
        } else if (record.status === "Leave") {
          totalLeaves++;
        }
      }

      const excessLeaves = Math.max(totalLeaves - allottedLeaves, 0);
      const shortTime = excessLeaves * workingHours;

      // Update or create salary record for the month
      await db.execute(
        `INSERT INTO Salaries (
          employee_id, month, gross_salary, net_salary, 
          overtime_hours_worked, leaves_used, short_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(employee_id, month)
        DO UPDATE SET 
          gross_salary = excluded.gross_salary,
          net_salary = excluded.net_salary,
          overtime_hours_worked = excluded.overtime_hours_worked,
          leaves_used = excluded.leaves_used,
          short_time = excluded.short_time`,
        [
          editingRecord.employee_id,
          currentMonth,
          monthlyTotalPay,
          monthlyTotalPay,
          monthlyOvertimeHours,
          totalLeaves,
          shortTime,
        ]
      );

      await fetchAttendance(pagination.current);

      notification.success({
        message: "Success",
        description: "Attendance record updated successfully.",
      });
      setIsEditModalVisible(false);
      setEditingRecord(null);
    } catch (error) {
      console.error("Error updating attendance:", error);
      notification.error({
        message: "Error",
        description: "Failed to update attendance record.",
      });
    }
  };

  const columns = [
    {
      title: "Employee Name",
      dataIndex: "employee_name",
      key: "employee_name",
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: "Employee ID",
      dataIndex: "employee_id",
      key: "employee_id",
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
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.check_out_time ||
          record.status === "Leave" ||
          record.status === "Absent" ? null : (
            <>
              <TimePicker
                format="HH:mm"
                value={checkOutTime}
                onChange={setCheckOutTime}
                placeholder="Check-out Time"
              />
              <Button type="primary" onClick={() => handleMarkCheckOut(record)}>
                Mark Check-out
              </Button>
            </>
          )}
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination) => {
    fetchAttendance(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <h3>Mark Check-in</h3>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Select
          showSearch
          placeholder="Select Employee"
          value={selectedEmployee}
          onChange={(value) => setSelectedEmployee(value)}
          style={{ width: "25%" }}
          single
          multiple={false}
          options={employees}
          disabled={loading}
          filterOption={(input, option) =>
            option.label.toLowerCase().includes(input.toLowerCase())
          }
        />
        <DatePicker
          value={dayjs(date)}
          onChange={(date) => setDate(date?.format("YYYY-MM-DD"))}
          format="YYYY-MM-DD"
          style={{ width: "25%" }}
          disabled={loading}
        />
        <Select
          value={status}
          onChange={(value) => setStatus(value)}
          style={{ width: "25%" }}
          disabled={loading}
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
          disabled={loading}
        />
        <Button type="primary" onClick={handleMarkCheckIn} disabled={loading}>
          Mark Check-in
        </Button>
      </Space>

      <h2>Attendance Table</h2>
      <Table
        columns={columns}
        dataSource={attendance}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        style={{ marginBottom: 20, overflow: "auto" }}
        loading={loading}
      />

      {isEditModalVisible && (
        <Modal
          title="Edit Attendance Record"
          open={isEditModalVisible}
          onOk={handleEditSubmit}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingRecord(null);
          }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <DatePicker
              value={dayjs(date)}
              onChange={(date) => setDate(date?.format("YYYY-MM-DD"))}
              format="YYYY-MM-DD"
              style={{ width: "50%" }}
              disabled={loading}
            />
            <Select
              value={status}
              onChange={(value) => setStatus(value)}
              style={{ width: "100%" }}
            >
              <Option value="Present">Present</Option>
              <Option value="Absent">Absent</Option>
              <Option value="Leave">Leave</Option>
            </Select>

            {status === "Present" && (
              <>
                <TimePicker
                  format="HH:mm"
                  value={checkInTime}
                  onChange={setCheckInTime}
                  style={{ width: "100%" }}
                  placeholder="Check-in Time"
                />
                <TimePicker
                  format="HH:mm"
                  value={checkOutTime}
                  onChange={setCheckOutTime}
                  style={{ width: "100%" }}
                  placeholder="Check-out Time"
                />
              </>
            )}
          </Space>
        </Modal>
      )}
    </div>
  );
};

export default AttendanceTable;
