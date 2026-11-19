import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "EPL - Exotica Premier League Analytics & Auction Platform",
  description: "Historical underarm cricket analytics, verified statistics, explainable insights and player auction intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="bg-[#02000D] text-[#EBDED4] min-h-screen flex flex-col font-sans antialiased selection:bg-[#A65E46] selection:text-[#EBDED4]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
