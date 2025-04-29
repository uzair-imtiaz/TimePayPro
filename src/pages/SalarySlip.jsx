import { Button, DatePicker, Flex, Form, notification, Select } from "antd";
import React, { useEffect, useRef, useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  pdf,
} from "@react-pdf/renderer";
import { getHourlySalary, getTax, saveFile } from "../utils";
import { useDatabase } from "../context/DatabaseContext";
import dayjs from "dayjs";

const MyPDF = ({ employee }) => {
  const styles = StyleSheet.create({
    page: {
      padding: 10,
      fontFamily: "Helvetica",
      fontSize: 10,
    },
    header: {
      textAlign: "center",
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 5,
    },
    subHeader: {
      textAlign: "center",
      fontSize: 12,
      marginBottom: 10,
    },
    table: {
      width: "100%",
      border: "1px solid black",
    },
    row: {
      flexDirection: "row",
      borderBottom: "1px solid black",
    },
    cell: {
      flex: 1,
      padding: 5,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Usman Colors Manufacturing</Text>
        <Text style={styles.subHeader}>Salary Slip - {employee.month}</Text>

        <View style={styles.table}>
          {[
            ["Employee No", employee.employee_id],
            ["Name", employee.name],
            ["Designation", employee.designation],
            ["Basic Salary", employee.base_salary],
            ["Working Days", employee.workingDays],
            ["Gross Salary", employee.gross_salary],
            ["Allowance", employee.allowance],
            ["Overtime", employee.overtime],
            ["Net Salary", employee.netSalary],
            ["Deduction", employee.deduction],
            ["Net Pay", employee.netPay],
          ].map(([label, value], index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.cell}>{label}</Text>
              <Text style={styles.cell}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Approved By: __________</Text>
          <Text>Received By: __________</Text>
        </View>
      </Page>
    </Document>
  );
};

const SalarySlip = () => {
  const [form] = Form.useForm();
  const { MonthPicker } = DatePicker;
  const db = useDatabase();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState({});
  // id: 43,
  // name: "Muhammad Qasam",
  // designation: "S. Guard",
  // month: "January-25",
  // basicSalary: "19,000",
  // workingDays: "31",
  // grossSalary: "19,000",
  // allowance: "9,000",
  // overtime: "0",
  // netSalary: "28,000",
  // deduction: "20,000",
  // netPay: "8,000",

  const fetchEmployee = async (employee, month) => {
    try {
      setLoading(true);
      const query = `SELECT 
            e.id AS employee_id,
            e.first_name || ' ' || e.last_name AS name,
            e.designation,
            e.base_salary,
            e.department,
            e.working_hours,
            e.allowance,
            s.month,
            s.gross_salary,
            s.advance,
            s.tax,
            s.overtime_hours_worked,
            s.leaves_used,
            s.short_time
        FROM Employees e
        JOIN Salaries s ON e.id = s.employee_id
        WHERE s.month = ? and e.id=?;`;
      let employeeData = await db.select(query, [month, employee]);
      employeeData = employeeData[0];
      
      console.log("employeeData", employeeData);

      const working_days = await getWorkignDays(month, employee);

      const hourlySalary =
        getHourlySalary(
          employeeData?.base_salary + employeeData?.allowance,
          employeeData?.working_hours,
          employeeData?.month
        ) || 0;

      employeeData.totalDeduction =
        (employeeData.advance || 0) +
        (employeeData.short_time || 0) * hourlySalary +
        getTax(employeeData.department, employeeData.designation);

      employeeData.netSalary =
        employeeData.gross_salary -
        employeeData.totalDeduction +
        (employeeData.allowance || 0) +
        (employeeData.overtime_hours_worked || 0) *
          (employeeData.overtime_rate || 0) *
          hourlySalary;

      setData({ ...employeeData, ...working_days[0] } ?? {});
    } catch (e) {
      notification.error({
        message: "Error",
        description: "Failed to fetch salary slip!",
      });
    } finally {
      setLoading(false);
    }
  };

  const getWorkignDays = async (month, employee) => {
    const query = `SELECT COUNT(*) AS working_days 
    FROM Attendance 
    WHERE employee_id = ? 
    AND strftime('%Y-%m', date) = ? 
    AND status = 'Present'`;

    console.log("month, employee", month, employee);

    const data = await db.select(query, [employee, month]);
    console.log("data", data);

    return data;
  };

  const save = async () => {
    try {
      const pdfBlob = await pdf(<MyPDF employee={data} />).toBlob();
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      await saveFile(`${data?.name}-${data?.month}-slip.pdf`, uint8Array);
      notification.success({
        message: "Success",
        description: "Slip saved successfully",
      });
    } catch (e) {
      // notification.error()
    }
  };

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

  const onFinish = (values) => {
    setLoading(true);
    fetchEmployee(values.employee, values.month.format("YYYY-MM")).finally(() =>
      setLoading(false)
    );
  };

  // get working days from attendance count
  // calculate deductions and net salary

  return (
    <div>
      <Flex gap={10}>
        <Form form={form} onFinish={onFinish}>
          <Form.Item
            name="employee"
            rules={[{ required: true, message: "Please select an employee!" }]}
          >
            <Select
              placeholder="Select an employee"
              style={{ width: "300px" }}
              onChange={() => setData(null)}
            >
              {employees.map((employee) => (
                <Option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} ({employee.id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="month"
            initialValue={dayjs()}
            rules={[{ required: true, message: "Please select a month!" }]}
          >
            <MonthPicker
              format="YYYY-MM"
              picker="month"
              style={{ width: "300px" }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Get Salary Slip
            </Button>
          </Form.Item>
        </Form>
      </Flex>
      {data && (
        <>
          <div
            id="salary-slip"
            style={{
              marginTop: "30px",
              width: "80mm",
              padding: "10px",
              border: "1px solid black",
              fontFamily: "Arial",
            }}
          >
            <h3 style={{ textAlign: "center" }}>Usman Colors Manufacturing</h3>
            <h4 style={{ textAlign: "center" }}>Salary Slip - {data.month}</h4>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td>Employee id</td>
                  <td>{data?.employee_id}</td>
                </tr>
                <tr>
                  <td>Name</td>
                  <td>{data?.name}</td>
                </tr>
                <tr>
                  <td>Designation</td>
                  <td>{data?.designation}</td>
                </tr>
                <tr>
                  <td>Basic Salary</td>
                  <td>{data?.base_salary}</td>
                </tr>
                <tr>
                  <td>Working Days</td>
                  <td>{data?.working_days}</td>
                </tr>
                <tr>
                  <td>Gross Salary</td>
                  <td>{data?.gross_salary?.toFixed?.(2)}</td>
                </tr>
                <tr>
                  <td>Allowance</td>
                  <td>{data?.allowance}</td>
                </tr>
                <tr>
                  <td>Overtime</td>
                  <td>{data?.overtime_hours_worked} hours</td>
                </tr>
                <tr>
                  <td>Net Salary</td>
                  <td>{data?.netSalary}</td>
                </tr>
                <tr>
                  <td>Deduction</td>
                  <td>{data?.totalDeduction}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Net Pay</strong>
                  </td>
                  <td>
                    <strong>{data?.netSalary}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Approved By: __________</span>
              <span>Received By: __________</span>
            </div>
          </div>
          <Button
            onClick={async () => {
              await save();
            }}
            type="primary"
            style={{ marginTop: "10px" }}
          >
            Print Salary Slip
          </Button>
        </>
      )}
    </div>
  );
};

export default SalarySlip;
