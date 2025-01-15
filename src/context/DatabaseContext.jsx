import React, { createContext, useContext, useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";

const DatabaseContext = createContext(null);

export const DatabaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initDb = async () => {
      const instance = await Database.load("sqlite:employee_management.db");
      setDb(instance);
    };

    initDb();
  }, []);

  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  return useContext(DatabaseContext);
};
