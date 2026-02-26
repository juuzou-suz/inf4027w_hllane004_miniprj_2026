import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from '@/context/NotificationContext';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import NavbarWrapper from "@/components/NavbarWrapper";

export const metadata = {
  title: "Curate - Art Auction Platform",
  description: "Real-time art auctions for emerging artists",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <NavbarWrapper />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}