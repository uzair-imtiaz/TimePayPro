import React, { useState, useEffect } from "react";
import { Form, InputNumber, Select, Button, notification } from "antd";
import { useDatabase } from "../context/DatabaseContext";

const { Option } = Select;

const AddAdvance = () => {
  const db = useDatabase();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await db.select(
          "SELECT id, first_name, last_name FROM Employees"
        );
        setEmployees(data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        notification.error({
          message: "Error",
          description: "Failed to load employees.",
        });
      }
    };

    fetchEmployees();
  }, []);

  const handleSubmit = async (values) => {
    const { employee_id, advance_amount } = values;

    try {
      setLoading(true);

      // Check if a salary record exists for the current month
      const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
      const salaryRecord = await db.select(
        "SELECT id FROM Salaries WHERE employee_id = ? AND month = ?",
        [employee_id, currentMonth]
      );

      if (salaryRecord.length === 0) {
        // If no salary record exists for the current month, create one
        await db.execute(
          "INSERT INTO Salaries (employee_id, month, gross_salary, advance, net_salary) VALUES (?, ?, 0, ?, 0)",
          [employee_id, currentMonth, advance_amount]
        );
      } else {
        // Update the advance in the existing salary record
        await db.execute(
          "UPDATE Salaries SET advance = advance + ? WHERE employee_id = ? AND month = ?",
          [advance_amount, employee_id, currentMonth]
        );
      }

      notification.success({
        message: "Success",
        description: "Advance added successfully.",
      });

      // Reset the form
      form.resetFields();
    } catch (error) {
      console.error("Error adding advance:", error);
      notification.error({
        message: "Error",
        description: "Failed to add advance.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Add Advance</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: "500px" }}
      >
        <Form.Item
          label="Select Employee"
          name="employee_id"
          rules={[{ required: true, message: "Please select an employee." }]}
        >
          <Select placeholder="Select an employee">
            {employees.map((employee) => (
              <Option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Advance Amount"
          name="advance_amount"
          rules={[
            { required: true, message: "Please enter the advance amount." },
            { type: "number", min: 1, message: "Amount must be at least 1." },
          ]}
        >
          <InputNumber
            placeholder="Enter advance amount"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddAdvance;
