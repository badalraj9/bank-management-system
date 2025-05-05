import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Building2, 
  RefreshCcw, 
  SendHorizonal,
  Users,
  Settings
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const isActiveRoute = (path: string) => {
    return location === path;
  };

  return (
    <aside className={cn(
      "bg-primary w-64 flex-shrink-0 h-full shadow-lg overflow-y-auto",
      className
    )}>
      <div className="flex items-center justify-center h-16 border-b border-primary-700">
        <h1 className="text-white text-xl font-semibold flex items-center">
          <Building2 className="mr-2 h-5 w-5" /> BankEase
        </h1>
      </div>
      
      <nav className="mt-5">
        <div className="px-4 mb-3 text-xs text-blue-300 uppercase font-semibold tracking-wide">
          Main
        </div>
        
        <NavLink 
          href="/dashboard" 
          icon={<LayoutDashboard className="h-5 w-5" />}
          text="Dashboard" 
          active={isActiveRoute("/dashboard") || isActiveRoute("/")} 
        />
        
        <NavLink 
          href="/accounts" 
          icon={<Building2 className="h-5 w-5" />}
          text="Accounts" 
          active={isActiveRoute("/accounts")} 
        />
        
        <NavLink 
          href="/transactions" 
          icon={<RefreshCcw className="h-5 w-5" />}
          text="Transactions" 
          active={isActiveRoute("/transactions")} 
        />
        
        <NavLink 
          href="/transfers" 
          icon={<SendHorizonal className="h-5 w-5" />}
          text="Transfers" 
          active={isActiveRoute("/transfers")} 
        />
        
        <div className="px-4 mt-5 mb-3 text-xs text-blue-300 uppercase font-semibold tracking-wide">
          Management
        </div>
        
        <NavLink 
          href="/users" 
          icon={<Users className="h-5 w-5" />}
          text="Users" 
          active={isActiveRoute("/users")} 
        />
        
        <NavLink 
          href="/settings" 
          icon={<Settings className="h-5 w-5" />}
          text="Settings" 
          active={isActiveRoute("/settings")} 
        />
      </nav>
    </aside>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  text: string;
  active: boolean;
}

function NavLink({ href, icon, text, active }: NavLinkProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center px-4 py-3 text-white hover:bg-primary-700 transition duration-150 cursor-pointer",
        active && "bg-primary-700"
      )}>
        <span className="w-5">{icon}</span>
        <span className="ml-3">{text}</span>
      </div>
    </Link>
  );
}
