import { Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2 as BuildingIcon, 
  RefreshCcw, 
  SendHorizonal,
  Users,
  Settings
} from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const [location, navigate] = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActiveRoute = (path: string) => {
    return location === path;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
      <div className="bg-primary w-64 h-full animate-in slide-in-from-left">
        <div className="flex items-center justify-between h-16 border-b border-primary-700 px-4">
          <h1 className="text-white text-xl font-semibold flex items-center">
            <Building2 className="mr-2 h-5 w-5" /> BankEase
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-primary-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="mt-5">
          <div className="px-4 mb-3 text-xs text-blue-300 uppercase font-semibold tracking-wide">
            Main
          </div>
          
          <NavLink 
            onClick={() => handleNavigation("/dashboard")}
            icon={<LayoutDashboard className="h-5 w-5" />}
            text="Dashboard" 
            active={isActiveRoute("/dashboard") || isActiveRoute("/")} 
          />
          
          <NavLink 
            onClick={() => handleNavigation("/accounts")}
            icon={<BuildingIcon className="h-5 w-5" />}
            text="Accounts" 
            active={isActiveRoute("/accounts")} 
          />
          
          <NavLink 
            onClick={() => handleNavigation("/transactions")}
            icon={<RefreshCcw className="h-5 w-5" />}
            text="Transactions" 
            active={isActiveRoute("/transactions")} 
          />
          
          <NavLink 
            onClick={() => handleNavigation("/transfers")}
            icon={<SendHorizonal className="h-5 w-5" />}
            text="Transfers" 
            active={isActiveRoute("/transfers")} 
          />
          
          <div className="px-4 mt-5 mb-3 text-xs text-blue-300 uppercase font-semibold tracking-wide">
            Management
          </div>
          
          <NavLink 
            onClick={() => handleNavigation("/users")}
            icon={<Users className="h-5 w-5" />}
            text="Users" 
            active={isActiveRoute("/users")} 
          />
          
          <NavLink 
            onClick={() => handleNavigation("/settings")}
            icon={<Settings className="h-5 w-5" />}
            text="Settings" 
            active={isActiveRoute("/settings")} 
          />
        </nav>
      </div>
    </div>
  );
}

interface NavLinkProps {
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
  active: boolean;
}

function NavLink({ onClick, icon, text, active }: NavLinkProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-4 py-3 text-white hover:bg-primary-700 transition duration-150 w-full text-left",
        active && "bg-primary-700"
      )}
    >
      <span className="w-5">{icon}</span>
      <span className="ml-3">{text}</span>
    </button>
  );
}
