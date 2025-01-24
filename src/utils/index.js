const taxables = ["ceo", "director"];

export const getTax = (department, designation = null) => {
  if (!designation && department === "bank") {
    return 4 * 113750;
  }
  if (department === "bank" && taxables.includes(designation.toLowerCase())) {
    return 113750;
  }
  return 0;
};

export const getHourlySalary = (salary, working_hours, days) => {
  return salary / days / working_hours;
};
