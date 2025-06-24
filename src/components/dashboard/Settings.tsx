import React from "react";
import { useLocation } from "react-router-dom";
import SettingsPreferences from "./SettingsPreferences";
import SettingsBilling from "./SettingsBilling";

const Settings = () => {
  const location = useLocation();

  const renderContent = () => {
    if (location.pathname.includes("/billing")) {
      return <SettingsBilling />;
    }
    // Default to preferences
    return <SettingsPreferences />;
  };

  return <div className="space-y-6">{renderContent()}</div>;
};

export default Settings;
