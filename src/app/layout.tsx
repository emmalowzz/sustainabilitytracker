import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import DisclaimerBar from "@/components/DisclaimerBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sustainability Tracker",
  description:
    "Tracker of sustainability and ESG regulatory developments across Singapore, Japan, Korea, Australia, India, China, the US, Brazil, the UK and the EU.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
        <DisclaimerBar />
      </body>
    </html>
  );
}
