// src/components/AppShell.js
"use client";
import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell({ user, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <Navbar user={user} onToggleSidebar={() => setOpen((v) => !v)} />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}