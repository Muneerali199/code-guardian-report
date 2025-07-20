// src/components/SettingsLayout.tsx
import { Outlet } from "react-router-dom";
import { SettingsNav } from "@/components/SettingsNav";

export function SettingsLayout() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SettingsNav />
        </aside>
        <div className="flex-1 lg:max-w-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}