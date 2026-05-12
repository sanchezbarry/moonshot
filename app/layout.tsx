import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistMonoHeading = Geist_Mono({subsets:['latin'],variable:'--font-heading'});

const spaceGrotesk = Space_Grotesk({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moonshot Play Rewards",
  description: "The next gen loyalty program for the mobile gamer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", spaceGrotesk.variable, geistMonoHeading.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
