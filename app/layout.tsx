import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const socialImage = `${protocol}://${host}/og.png`;
  const title = "ASSERA — A denial isn’t the final word.";
  const description =
    "A human-centered workspace for understanding prior-authorization denials and preparing the next step.";

  return {
    title: {
      default: title,
      template: "%s | ASSERA",
    },
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "ASSERA",
      images: [
        {
          url: socialImage,
          width: 1731,
          height: 909,
          alt: "ASSERA — A denial isn’t the final word.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
