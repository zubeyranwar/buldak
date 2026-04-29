import type { Metadata } from "next";
import "./globals.css";
import localFont from 'next/font/local'
import { DM_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Container } from "@/components/container";
import { Footer } from "@/components/footer";

export const blackhood = localFont({
  src: '../../public/fonts/blackhood.ttf',
  display: 'swap',
  variable: '--font-blackhood',
})

export const interDisplay = localFont({
  src: '../../public/fonts/InterDisplay-Regular.ttf',
  display: 'swap',
  variable: '--font-inter-display',
})

export const dmMono = DM_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: "Buldak Doro",
  description: "Buldak Doro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interDisplay.variable} ${blackhood.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Container>
          <Navbar />
        </Container>
        {children}</body>
      <Container>
        <Footer />
      </Container>
    </html>
  );
}
