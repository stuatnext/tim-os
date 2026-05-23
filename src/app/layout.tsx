import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Tim OS — Vertical Entertainment Intelligence",
  description:
    "Live brand & opportunity dashboard for Timothy Oh — Global CMO & GM of COL Group International.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen grid grid-cols-[240px_1fr]">
          <Sidebar />
          <main className="bg-paper">{children}</main>
        </div>
      </body>
    </html>
  );
}
