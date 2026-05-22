"use client";

import { useState } from "react";

type ResponsiveAppLayoutProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

export function ResponsiveAppLayout({ sidebar, children }: ResponsiveAppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <div className="mobile-topbar">
        <button
          className="secondary-button"
          type="button"
          onClick={() => setIsSidebarOpen((current) => !current)}
        >
          Workspace
        </button>
      </div>
      <main className="app-layout">
        <div className={isSidebarOpen ? "app-sidebar app-sidebar--mobile-open" : "app-sidebar"}>
          {sidebar}
        </div>
        <div className="content-stack">{children}</div>
      </main>
      {isSidebarOpen ? (
        <button
          className="mobile-backdrop"
          type="button"
          aria-label="Close menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}
    </>
  );
}
