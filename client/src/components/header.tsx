import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { logoutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, firebaseUser } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const getPageTitle = () => {
    switch (location) {
      case "/":
      case "/dashboard":
        return "Dashboard";
      case "/accounts":
        return "Accounts";
      case "/transactions":
        return "Transactions";
      case "/transfers":
        return "Transfers";
      case "/users":
        return "Users";
      case "/settings":
        return "Settings";
      default:
        return "BankEase";
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden text-gray-500 hover:text-gray-700"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h2>
      </div>
      
      <div className="flex items-center">
        {/* Search bar - hidden on mobile */}
        <div className="hidden md:flex relative mr-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-gray-50 border border-gray-200 rounded-md pl-9 pr-3 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 relative mx-1">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
            3
          </span>
        </Button>
        
        {/* User profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center ml-3 p-1 h-auto">
              <Avatar className="h-8 w-8 border-2 border-gray-200">
                <AvatarImage src={firebaseUser?.photoURL || undefined} />
                <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="ml-2 hidden md:block text-left">
                <p className="text-sm font-medium text-gray-800">{user?.displayName || "User"}</p>
                <p className="text-xs text-gray-500">Bank Manager</p>
              </div>
              <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
