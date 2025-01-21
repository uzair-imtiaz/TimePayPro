import React, { useEffect, useState } from "react";
import { Table, Avatar, notification, Popconfirm, Button } from "antd";
import { useDatabase } from "../context/DatabaseContext";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const EmployeeTable = () => {
  const navigate = useNavigate();
  const db = useDatabase();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeData = await db.select("select * from employees");
        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching employees:", error);
        notification.error({
          message: "Error",
          description: "Failed to load employee data.",
        });
      }
    };

    fetchEmployees();
  }, []);

  const toggleEmployeeStatus = async (employeeId, status) => {
    try {
      let _status;
      if (status === "Active") {
        _status = "Inactive";
      } else {
        _status = "Active";
      }
      await db.execute(
        `UPDATE employees SET status = '${_status}' WHERE id = ?`,
        [employeeId]
      );
      notification.success({
        message: "Success",
        description: `Employee marked as ${_status.toLowerCase()}.`,
      });

      // Refresh employee data
      const updatedEmployees = await db.select("select * from employees");
      setEmployees(updatedEmployees);
    } catch (error) {
      console.error("Error updating employee status:", error);
      notification.error({
        message: "Error",
        description: "Failed to update employee status.",
      });
    }
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "picture_path",
      key: "picture_path",
      render: (text) =>
        text ? (
          <Avatar
            src={`../../src-tauri/${text}`}
            alt="Avatar"
            style={{ width: 40, height: 40 }}
          />
        ) : (
          <Avatar style={{ backgroundColor: "#bb2025" }}>N/A</Avatar>
        ),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
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
      title: "Father Name",
      dataIndex: "father_name",
      key: "father_name",
    },
    {
      title: "CNIC",
      dataIndex: "cnic",
      key: "cnic",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Wage Type",
      dataIndex: "wage_type",
      key: "wage_type",
    },
    {
      title: "Hourly Rate",
      dataIndex: "hourly_rate",
      key: "hourly_rate",
      render: (text) => (text ? `$${text}` : "-"),
    },
    {
      title: "Base Salary",
      dataIndex: "base_salary",
      key: "base_salary",
      render: (text) => (text ? `$${text}` : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      render: (_, record) => (
        <Popconfirm
          title={`Are you sure you want to mark this employee as ${
            record.status === "Active" ? "inactive" : "active"
          }?`}
          onConfirm={() => toggleEmployeeStatus(record.id, record.status)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" danger>
            {record.status === "Active" ? (
              <CloseCircleTwoTone twoToneColor={"#ff4d4f"} />
            ) : (
              <CheckCircleTwoTone twoToneColor="#52c41a" />
            )}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={employees}
        rowKey="id"
        pagination={false}
        style={{
          marginTop: 20,
          width: "100%",
          overflow: "auto",
          display: "block",
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/employees/${record.id}`),
          style: { cursor: "pointer" },
        })}
      />
    </div>
  );
};

export default EmployeeTable;
