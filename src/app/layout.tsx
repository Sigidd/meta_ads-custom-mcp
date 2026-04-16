import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://meta-ads-custom-mcp.vercel.app";

export const metadata: Metadata = {
  title: "Meta Ads MCP",
  description: "MCP server connecting Claude to Meta Ads API",
  icons: { icon: "/icon.png", apple: "/icon.png" },
  openGraph: { images: [`${BASE_URL}/icon.png`] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
