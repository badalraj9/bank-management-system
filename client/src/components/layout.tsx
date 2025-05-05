import { ReactNode, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MobileDrawer from "@/components/MobileDrawer";
import { useAuth } from "@/providers/AuthProvider";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();

  // Don't show layout on login page
  if (location === "/login") {
    return <>{children}</>;
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar - hidden on mobile */}
      <Sidebar className="hidden md:block" />
      
      {/* Mobile Drawer */}
      <MobileDrawer isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileMenuToggle={toggleMobileMenu} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
