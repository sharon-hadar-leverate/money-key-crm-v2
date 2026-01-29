import type { Metadata } from "next"
import { Heebo } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
})

export const metadata: Metadata = {
  title: "Money Key - CRM",
  description: "Lead Management System",
  openGraph: {
    title: "Money Key - CRM",
    description: "Lead Management System",
    images: ["/assets/moneykey-linkdin3.png"],
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  )
}
