import React from "react";
import { Tabs } from "antd";
import SummaryReport from "./SummaryReport";
import DetailedReport from "./DetailedReport";
import SalaryReport from "./SalaryReport";

const ReportsPage = () => {
  return (
    <div style={{ padding: "20px" }}>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Summary Report" key="1">
          <SummaryReport />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Detailed Report" key="2">
          <DetailedReport />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Salary Report" key="3">
          <SalaryReport />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
