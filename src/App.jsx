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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const handleLogin = () => {
    setIsLoggedIn(true);
    // localStorage.setItem("isLoggedIn", "true");
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
              {/* <Route path="/attendance" element={<AttendanceTable />} /> */}
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
