import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthProvider";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { MobileNav } from "../components/layout/MobileNav";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Airbnb | Holiday Rentals, Cabins, Beach Houses & More",
  description: "Find vacation rentals, cabins, beach houses, unique homes, and experiences around the world on Airbnb.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-[#222222]">
        <AuthProvider>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <MobileNav />
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#222222",
                color: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #333333",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
