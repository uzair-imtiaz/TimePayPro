// import React, { useEffect, useState } from "react";
// import {
//   Table,
//   Button,
//   notification,
//   AutoComplete,
//   DatePicker,
//   Space,
//   TimePicker,
//   Select,
// } from "antd";
// import { useDatabase } from "../context/DatabaseContext";
// import dayjs from "dayjs";

// const AttendanceTable = () => {
//   const db = useDatabase();
//   const [attendance, setAttendance] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [filteredEmployees, setFilteredEmployees] = useState([]);
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [status, setStatus] = useState("Present");
//   const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
//   const [checkInTime, setCheckInTime] = useState(null);
//   const [checkOutTime, setCheckOutTime] = useState(null);

//   useEffect(() => {
//     const fetchAttendance = async () => {
//       try {
//         const data = await db.select(
//           "SELECT a.id, e.first_name, e.last_name, a.date, a.status, a.check_in_time, a.check_out_time FROM Attendance a INNER JOIN Employees e ON a.employee_id = e.id"
//         );
//         setAttendance(data);
//       } catch (error) {
//         console.error("Error fetching attendance data:", error);
//         notification.error({
//           message: "Error",
//           description: "Failed to load attendance data.",
//         });
//       }
//     };

//     const fetchEmployees = async () => {
//       try {
//         const employeesData = await db.select(
//           "SELECT id, first_name, last_name FROM Employees where status = 'Active'"
//         );
//         setEmployees(employeesData);
//         setFilteredEmployees(
//           employeesData.map((emp) => ({
//             value: `${emp.first_name} ${emp.last_name}`,
//             label: `${emp.first_name} ${emp.last_name}`,
//           }))
//         );
//       } catch (error) {
//         console.error("Error fetching employees:", error);
//       }
//     };

//     fetchAttendance();
//     fetchEmployees();
//   }, []);

//   const handleSearchEmployee = (value) => {
//     const filtered = employees
//       .filter((emp) =>
//         `${emp.first_name} ${emp.last_name}`
//           .toLowerCase()
//           .includes(value.toLowerCase())
//       )
//       .map((emp) => ({
//         value: `${emp.first_name} ${emp.last_name}`,
//         label: `${emp.first_name} ${emp.last_name}`,
//       }));

//     setFilteredEmployees(filtered);
//   };

//   const handleMarkCheckIn = async () => {
//     if (!selectedEmployee || !status || !date || !checkInTime) {
//       notification.error({
//         message: "Error",
//         description: "Please select all fields.",
//       });
//       return;
//     }

//     try {
//       await db.execute(
//         `
//         INSERT INTO Attendance (employee_id, date, status, check_in_time, check_out_time)
//         VALUES (?, ?, ?, ?, NULL)
//         ON CONFLICT(employee_id, date)
//         DO UPDATE SET status = ?, check_in_time = ?;
//         `,
//         [
//           selectedEmployee,
//           date,
//           status,
//           checkInTime.format("HH:mm"),
//           status,
//           checkInTime.format("HH:mm"),
//         ]
//       );

//       notification.success({
//         message: "Success",
//         description: "Check-in time marked successfully.",
//       });

//       const updatedAttendance = await db.select(
//         "SELECT a.id, e.first_name, e.last_name, a.date, a.status, a.check_in_time, a.check_out_time FROM Attendance a INNER JOIN Employees e ON a.employee_id = e.id"
//       );
//       setAttendance(updatedAttendance);
//     } catch (error) {
//       console.error("Error marking check-in:", error);
//       notification.error({
//         message: "Error",
//         description: "Failed to mark check-in.",
//       });
//     }
//   };

//   const handleMarkCheckOut = async (record) => {
//     if (!checkOutTime) {
//       notification.error({
//         message: "Error",
//         description: "Please select a check-out time.",
//       });
//       return;
//     }

//     try {
//       await db.execute(
//         `
//         UPDATE Attendance
//         SET check_out_time = ?
//         WHERE id = ?;
//         `,
//         [checkOutTime?.format("HH:mm"), record.id]
//       );

//       notification.success({
//         message: "Success",
//         description: "Check-out time updated successfully.",
//       });

//       const updatedAttendance = await db.select(
//         "SELECT a.id, e.first_name, e.last_name, a.date, a.status, a.check_in_time, a.check_out_time FROM Attendance a INNER JOIN Employees e ON a.employee_id = e.id"
//       );

//       const currentMonth = new Date().toISOString().slice(0, 7);
//       const hoursWorked = dayjs(checkOutTime).diff(dayjs(checkInTime), "hours");

//       setAttendance(updatedAttendance);
//     } catch (error) {
//       console.error("Error updating check-out:", error);
//       notification.error({
//         message: "Error",
//         description: "Failed to update check-out time.",
//       });
//     }
//   };

//   const columns = [
//     {
//       title: "Employee Name",
//       dataIndex: "employee_name",
//       key: "employee_name",
//       render: (_, record) => `${record.first_name} ${record.last_name}`,
//     },
//     {
//       title: "Date",
//       dataIndex: "date",
//       key: "date",
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//     },
//     {
//       title: "Check-in Time",
//       dataIndex: "check_in_time",
//       key: "check_in_time",
//     },
//     {
//       title: "Check-out Time",
//       dataIndex: "check_out_time",
//       key: "check_out_time",
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_, record) =>
//         record.check_out_time ? (
//           "Check-out complete"
//         ) : (
//           <Space>
//             <TimePicker
//               format="HH:mm"
//               value={checkOutTime}
//               onChange={setCheckOutTime}
//               placeholder="Check-out Time"
//             />
//             <Button type="primary" onClick={() => handleMarkCheckOut(record)}>
//               Mark Check-out
//             </Button>
//           </Space>
//         ),
//     },
//   ];

//   return (
//     <div>
//       <h2>Attendance Table</h2>
//       <Table
//         columns={columns}
//         dataSource={attendance}
//         rowKey="id"
//         pagination={false}
//         style={{ marginBottom: 20, overflow: "auto" }}
//       />
//       <h3>Mark Check-in</h3>
//       <Space direction="vertical" size="large" style={{ display: "flex" }}>
//         {/* <AutoComplete
//           style={{ width: "25%" }}
//           placeholder="Select Employee"
//           options={filteredEmployees}
//           onSearch={handleSearchEmployee}
//           onSelect={(value) => setSelectedEmployee(value)}
//         /> */}
//         <Select
//           // prefix="User"
//           // mode="multiple"
//           style={{ width: 200 }}
//           onChange={handleSearchEmployee}
//           options={filteredEmployees}
//           showSearch
//         />
//         <DatePicker
//           value={dayjs(date)}
//           onChange={(date) => setDate(date.format("YYYY-MM-DD"))}
//           format="YYYY-MM-DD"
//           style={{ width: "25%" }}
//         />
//         <Select
//           value={status}
//           onChange={(value) => setStatus(value)}
//           style={{ width: "25%" }}
//         >
//           <Option value="Present">Present</Option>
//           <Option value="Absent">Absent</Option>
//           <Option value="Leave">Leave</Option>
//         </Select>
//         <TimePicker
//           format="HH:mm"
//           value={checkInTime}
//           onChange={setCheckInTime}
//           style={{ width: "25%" }}
//           placeholder="Check-in Time"
//         />
//         <Button type="primary" onClick={handleMarkCheckIn}>
//           Mark Check-in
//         </Button>
//       </Space>
//     </div>
//   );
// };

// export default AttendanceTable;

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
          "SELECT a.id, e.first_name, e.last_name, a.date, a.status, a.check_in_time, a.check_out_time FROM Attendance a INNER JOIN Employees e ON a.employee_id = e.id"
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
        setEmployees(
          employeesData.map((emp) => {
            return {
              value: emp.id,
              label: `${emp.first_name} ${emp.last_name}`,
            };
          })
        );
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchAttendance();
    fetchEmployees();
  }, []);

  const handleMarkCheckIn = async () => {
    if (!selectedEmployee || !status || !date || !checkInTime) {
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

      const updatedAttendance = await db.select(
        "SELECT a.id, e.first_name, e.last_name, a.date, a.status, a.check_in_time, a.check_out_time FROM Attendance a INNER JOIN Employees e ON a.employee_id = e.id"
      );
      setAttendance(updatedAttendance);
    } catch (error) {
      console.error("Error marking check-in:", error);
      notification.error({
        message: "Error",
        description: "Failed to mark check-in.",
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
      await db.execute(
        `
        UPDATE Attendance
        SET check_out_time = ?
        WHERE id = ?;
        `,
        [checkOutTime.format("HH:mm"), record.id]
      );

      notification.success({
        message: "Success",
        description: "Check-out time updated successfully.",
      });

      const updatedAttendance = await db.select(
        "SELECT a.id, e.first_name, e.last_name, a.date, a.status, a.check_in_time, a.check_out_time FROM Attendance a INNER JOIN Employees e ON a.employee_id = e.id"
      );
      setAttendance(updatedAttendance);
    } catch (error) {
      console.error("Error updating check-out:", error);
      notification.error({
        message: "Error",
        description: "Failed to update check-out time.",
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
      render: (_, record) =>
        record.check_out_time ? (
          "Check-out complete"
        ) : (
          <Space>
            <TimePicker
              format="HH:mm"
              value={checkOutTime}
              onChange={setCheckOutTime}
              placeholder="Check-out Time"
            />
            <Button type="primary" onClick={() => handleMarkCheckOut(record)}>
              Mark Check-out
            </Button>
          </Space>
        ),
    },
  ];

  return (
    <div>
      <h2>Attendance Table</h2>
      <Table
        columns={columns}
        dataSource={attendance}
        rowKey="id"
        pagination={false}
        style={{ marginBottom: 20, overflow: "auto" }}
      />
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
          filterOption={(input, option) =>
            option.label.toLowerCase().includes(input.toLowerCase())
          }
        />
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
        <Button type="primary" onClick={handleMarkCheckIn}>
          Mark Check-in
        </Button>
      </Space>
    </div>
  );
};

export default AttendanceTable;
