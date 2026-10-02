import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Family Hub — chores, points and rewards",
    template: "%s · Family Hub",
  },
  description:
    "A simple, stylish home for your family's chores, points and rewards.",
  // iOS reads this when the app is added to the home screen via Safari.
  appleWebApp: {
    capable: true,
    title: "Family Hub",
    // Lets the content run under the status bar; the shell then pads itself
    // clear of it with env(safe-area-inset-*).
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0912",
  // Lets the page extend into the notch and gesture-bar areas on iOS. Safe to
  // set everywhere; Android Chrome ignores it.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="aurora" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}

