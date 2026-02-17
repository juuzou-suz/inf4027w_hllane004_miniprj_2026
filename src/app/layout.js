import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
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
            <NavbarWrapper />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}