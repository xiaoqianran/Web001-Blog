import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blog — 写一点，记一点",
    template: "%s · Blog",
  },
  description: "一个用 Next.js 构建的简洁个人博客，支持 Markdown 文章与标签。",
  openGraph: {
    title: "Blog — 写一点，记一点",
    description: "一个用 Next.js 构建的简洁个人博客。",
    type: "website",
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
        <ThemeProvider>
          <Header />
          <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-14">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
