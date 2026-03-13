import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import ReduxProvider from "@/components/ReduxProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EnergyPilot — Smart Energy Monitoring",
  description:
    "Monitor your energy consumption in real-time with EnergyPilot. Track devices, visualize trends, and reduce costs.",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white`}
      >
        <ClerkProvider>
          <ConvexClientProvider>
            <ReduxProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange
                forcedTheme="dark"
              >
                <TooltipProvider delayDuration={200}>
                  {children}
                </TooltipProvider>
              </ThemeProvider>
            </ReduxProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
