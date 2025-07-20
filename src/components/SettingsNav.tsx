// src/components/SettingsNav.tsx
import { NavLink } from "react-router-dom";
import { Github, Settings } from "lucide-react";

export function SettingsNav() {
  return (
    <div className="space-y-1">
      <h3 className="mb-4 px-4 text-lg font-medium">Settings</h3>
      <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
        <NavLink
          to="/settings/github"
          className={({ isActive }) =>
            `flex items-center px-4 py-2 rounded-lg ${
              isActive
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline"
            }`
          }
        >
          <Github className="w-4 h-4 mr-2" />
          GitHub
        </NavLink>
      </nav>
    </div>
  );
}