import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Footer from "@/components/footer";
import NavbarWrapper from "@/components/NavbarWrapper";

export const metadata = {
  title: "Curate. | Premium Art Auctions and Contemporary Works",
  description:
    "Discover contemporary African art, collect original works, and bid in real time through a curated auction experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-ZA">
      <body className="flex min-h-screen flex-col">
        {/* Providers*/}
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <NavbarWrapper />
              <main className="flex-grow">{children}</main>
              <Footer />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}