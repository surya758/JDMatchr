import React from "react";
import { useLocation } from "react-router-dom";
import SettingsAccount from "./SettingsAccount";
import SettingsPreferences from "./SettingsPreferences";
import SettingsBilling from "./SettingsBilling";

const Settings = () => {
  const location = useLocation();

  const renderContent = () => {
    if (location.pathname.includes("/account")) {
      return <SettingsAccount />;
    } else if (location.pathname.includes("/preferences")) {
      return <SettingsPreferences />;
    } else if (location.pathname.includes("/billing")) {
      return <SettingsBilling />;
    }
    // Default to account
    return <SettingsAccount />;
  };

  return <div className="space-y-6">{renderContent()}</div>;
};

export default Settings;
