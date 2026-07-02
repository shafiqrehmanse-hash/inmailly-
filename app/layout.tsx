import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "500", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "InMailly — Premium LinkedIn Outreach Infrastructure",
  description:
    "Reach thousands of decision makers on LinkedIn without enterprise InMail pricing. Human-operated outreach at scale.",
  icons: {
    icon: [
      { url: `/favicon.ico?v=4`, sizes: "any" },
      { url: `/favicon-32.png?v=4`, type: "image/png", sizes: "32x32" },
      { url: `/favicon-16.png?v=4`, type: "image/png", sizes: "16x16" },
      { url: `/icon.png?v=4`, type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: `/apple-icon.png?v=4`, type: "image/png", sizes: "180x180" }],
    shortcut: `/favicon.ico?v=4`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
