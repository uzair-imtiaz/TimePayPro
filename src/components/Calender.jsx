import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import {
  Calendar as AntdCalendar,
  Col,
  Row,
  Select,
  Typography,
  Badge,
  theme,
} from "antd";
import dayLocaleData from "dayjs/plugin/localeData";
dayjs.extend(dayLocaleData);

const Calendar = ({ title, attendanceData, onMonthChange, ...rest }) => {
  const { token } = theme.useToken();

  const wrapperStyle = {
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
  };

  // Map attendance data to highlight days
  const getAttendanceStatus = (date) => {
    const dateString = date.format("YYYY-MM-DD");
    const record = attendanceData.find((att) => att.date === dateString);
    return record ? record.status : null;
  };

  const dateFullCellRender = (value) => {
    const attendanceStatus = getAttendanceStatus(value);
    const isWeekend = value.day() === 0 || value.day() === 6;

    return (
      <div
        style={{
          padding: 8,
          borderRadius: 4,
          backgroundColor: isWeekend ? "#fafafa" : token.colorBgContainer,
          textAlign: "center",
        }}
      >
        <Badge
          count={value.format("DD")}
          color={
            attendanceStatus === "Present"
              ? "green"
              : attendanceStatus === "Absent"
              ? "red"
              : attendanceStatus === "Leave"
              ? "blue"
              : isWeekend
              ? "#faad14"
              : "gray"
          }
        />
      </div>
    );
  };

  return (
    <div style={wrapperStyle}>
      <AntdCalendar
        fullscreen={false}
        fullCellRender={dateFullCellRender}
        headerRender={({ value, onChange }) => {
          const start = 0;
          const end = 12;
          const monthOptions = [];
          let current = value.clone();
          const localeData = value.localeData();
          const months = [];
          for (let i = 0; i < 12; i++) {
            current = current.month(i);
            months.push(localeData.monthsShort(current));
          }
          for (let i = start; i < end; i++) {
            monthOptions.push(
              <Select.Option key={i} value={i} className="month-item">
                {months[i]}
              </Select.Option>
            );
          }
          const year = value.year();
          const month = value.month();
          const yearOptions = [];
          for (let i = year - 10; i < year + 10; i++) {
            yearOptions.push(
              <Select.Option key={i} value={i} className="year-item">
                {i}
              </Select.Option>
            );
          }
          return (
            <div style={{ padding: 8 }}>
              {title && <Typography.Title level={4}>{title}</Typography.Title>}
              <Row gutter={8}>
                <Col>
                  <Select
                    size="small"
                    popupMatchSelectWidth={false}
                    value={year}
                    onChange={(newYear) => {
                      const now = value.clone().year(newYear);
                      onChange(now);
                      onMonthChange && onMonthChange(now); // Notify parent
                    }}
                  >
                    {yearOptions}
                  </Select>
                </Col>
                <Col>
                  <Select
                    size="small"
                    popupMatchSelectWidth={false}
                    value={month}
                    onChange={(newMonth) => {
                      const now = value.clone().month(newMonth);
                      onChange(now);
                      onMonthChange && onMonthChange(now); // Notify parent
                    }}
                  >
                    {monthOptions}
                  </Select>
                </Col>
              </Row>
            </div>
          );
        }}
        {...rest}
      />
    </div>
  );
};

export default Calendar;
