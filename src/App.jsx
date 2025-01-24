import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Sidebar from "./components/Sidebar";
import AddEmployee from "./pages/AddEmployee";
import Login from "./pages/Login";
import EmployeeTable from "./components/EmployeeTable";
import { DatabaseProvider } from "./context/DatabaseContext";
import AttendanceTable from "./components/AttendanceTable";
import EmployeeDetail from "./pages/EmployeeDetail";
import ReportsPage from "./components/Reports";
import AddAdvance from "./pages/AddAdvance";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <DatabaseProvider>
      <Router>
        {isLoggedIn ? (
          <Sidebar>
            <Routes>
              {/* <Route path="/dashboard" element={<Dashboard />} /> */}
              <Route path="/add-employee" element={<AddEmployee />} />
              <Route path="/employees" element={<EmployeeTable />} />
              <Route path="/attendance" element={<AttendanceTable />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/advance" element={<AddAdvance />} />
              {/* <Route path="*" element={<Navigate to="/dashboard" />} /> */}
            </Routes>
          </Sidebar>
        ) : (
          <Routes>
            <Route
              path="/login"
              element={<Login onLoginSuccess={handleLogin} />}
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </Router>
    </DatabaseProvider>
  );
}

export default App;
