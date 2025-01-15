import React from "react";
import { Layout } from "antd";
import AddEmployeeForm from "../components/AddEmployeeForm";

const { Header, Content, Footer } = Layout;

const AddEmployee = () => {
  return (
    // <Layout>
    //   <Header
    //     style={{
    //       color: "white",
    //       textAlign: "center",
    //       justifyContent: "center",
    //       alignItems: "center",
    //       display: "flex",
    //       borderRadius: "10px",
    //     }}
    //   >
    //     <h1>Add Employee</h1>
    //   </Header>
    //   <Content style={{ padding: "20px", borderRadius: "10px" }}>
    //     <AddEmployeeForm />
    //   </Content>
    // </Layout>
    <AddEmployeeForm />
  );
};

export default AddEmployee;
