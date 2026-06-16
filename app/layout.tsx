import type { Metadata, Viewport } from "next";
import AppProviders from "@/components/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Aksharvan — जादूई जंगल",
  description: "अक्षरवन — हिंदी अक्षर सीखो जादुई जंगल में",
  manifest:    "/manifest.json",
  appleWebApp: { capable:true, statusBarStyle:"black-translucent", title:"Aksharvan" },
  other:       { "mobile-web-app-capable":"yes" },
};

export const viewport: Viewport = {
  width:"device-width", initialScale:1, maximumScale:1,
  userScalable:false, themeColor:"#0D1117", viewportFit:"cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Mukta:wght@400;500;600;700&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* bg-night ensures body background even before any page CSS loads */}
      <body className="font-body bg-night" style={{ background:"#0D1117" }}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
