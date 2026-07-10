import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSiteConfig } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const site = getSiteConfig();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  alternates: {
    types: {
      "application/rss+xml": `${siteUrl}/rss.xml`,
    },
  },
};

const themeInitScript = `
(function(){
  try {
    var k='blog-theme';
    var t=localStorage.getItem(k);
    var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark=t==='dark'||(t!=='light'&&d);
    if(dark) document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme=dark?'dark':'light';
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-violet-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
        >
          跳到正文
        </a>
        <ThemeProvider>
          <Header />
          <main
            id="main-content"
            className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-14"
          >
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
