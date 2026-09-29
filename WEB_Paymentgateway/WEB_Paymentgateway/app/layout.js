import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata = {
  title: "WEB_Paymentgateway",
  description: "Sistem pembayaran dengan payment gateway Xendit",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <CartProvider>
          <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border sm:border-line">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
