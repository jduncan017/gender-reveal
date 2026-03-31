import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

export const metadata: Metadata = {
  title: "Baby Marzofka-Duncan Gender Reveal",
  description: "Something special is on the way!",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Baby Marzofka-Duncan Gender Reveal",
    description: "Something special is on the way!",
    images: [{ url: "/opengraph.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baby Marzofka-Duncan Gender Reveal",
    description: "Something special is on the way!",
    images: ["/opengraph.png"],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
