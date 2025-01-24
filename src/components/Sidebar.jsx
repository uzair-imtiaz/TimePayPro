// frontend/src/components/Sidebar.js

import React from "react";
import { Layout, Menu } from "antd";
import {
  TeamOutlined,
  UserAddOutlined,
  CalendarOutlined,
  BarChartOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Sider, Content } = Layout;

const Sidebar = ({ children }) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} className="site-layout-background">
        <Menu
          mode="inline"
          defaultSelectedKeys={["1"]}
          style={{ height: "100%", borderRight: 0 }}
        >
          <Menu.Item key="1" icon={<TeamOutlined />}>
            <Link to="/employees">Employees</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<UserAddOutlined />}>
            <Link to="/add-employee">Add Employee</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<CalendarOutlined />}>
            <Link to="/attendance">Attendance</Link>
          </Menu.Item>
          <Menu.Item key="4" icon={<BarChartOutlined />}>
            <Link to="/reports">Reports</Link>
          </Menu.Item>
          <Menu.Item key="5" icon={<DollarCircleOutlined />}>
            <Link to="/advance">Advance</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ padding: "0 0px 10px 10px" }}>
        <Content
          style={{
            padding: 18,
            margin: 0,
            minHeight: 280,
            background: "#fff",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;
