"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function AppShell({ user, children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide app chrome on any /auth/* route
  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
        <div className="flex flex-1 flex-col lg:pl-64">
          <Navbar user={user} onToggleSidebar={() => setOpen((v) => !v)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}