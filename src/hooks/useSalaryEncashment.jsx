import { useEffect } from "react";
import dayjs from "dayjs";
import { runLeaveEncashmentBatch } from "../db/salaryBatch";
import { useDatabase } from "../context/DatabaseContext";

export const useMonthEndCheck = (month) => {
    const db = useDatabase();
  useEffect(() => {
    const interval = setInterval(() => {
      const now = dayjs();
      const lastDayOfMonth = now.endOf("month").format("YYYY-MM-DD");
      const currentDate = now.format("YYYY-MM-DD");
      const currentTime = now.format("HH:mm");

      if (currentDate === lastDayOfMonth && currentTime >= "17:00") {
        console.log("5:00 PM on month-end reached. Running batch...");
        runLeaveEncashmentBatch(month, db);
        clearInterval(interval); // Stop checking after it runs once
      }
    }, 1800000); 

    return () => clearInterval(interval);
  }, [month]);
};
