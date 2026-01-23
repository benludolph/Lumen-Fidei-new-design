import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Sun,
  Library,
  Menu,
  X
} from "lucide-react";
import { Button } from "../ui/button";

function NavItem({ href, icon: Icon, label, onClick }: { href: string; icon: any; label: string; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = (path: string) => location === path || location.startsWith(path + "/");
  
  return (
    <Link href={href} className="w-full" onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
        isActive(href) 
          ? "bg-secondary text-primary font-medium shadow-sm" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}>
        <Icon className={cn("w-5 h-5", isActive(href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span>{label}</span>
      </div>
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const handleLogout = () => {
    if (onNavClick) onNavClick();
    logout();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <Sun className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-lg leading-tight text-primary">Lumen Fidei</h1>
          <p className="text-xs text-muted-foreground">30-Day Journey</p>
        </div>
      </div>

      <div className="space-y-1 flex-1">
        <div className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Menu
        </div>
        
        {user.role === 'participant' && (
          <NavItem href="/dashboard" icon={BookOpen} label="My Journey" onClick={onNavClick} />
        )}
        
        {(user.role === 'mentor' || user.role === 'admin') && (
          <NavItem href="/mentor" icon={Users} label="Mentorship" onClick={onNavClick} />
        )}

        {user.role === 'admin' && (
          <NavItem href="/admin" icon={Settings} label="Admin Portal" onClick={onNavClick} />
        )}

        <div className="pt-6 px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Support
        </div>
        
        <NavItem href="/messages" icon={MessageSquare} label="Messages" onClick={onNavClick} />
        <NavItem href="/resources" icon={Library} label="Resources" onClick={onNavClick} />
      </div>

      <div className="pt-6 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-medium text-sm">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="hidden md:flex w-64 h-screen bg-background border-r border-border flex-col p-6 fixed left-0 top-0 z-20">
      <SidebarContent />
    </div>
  );
}

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <Sun className="w-5 h-5" />
        </div>
        <h1 className="font-serif font-bold text-base text-primary">Lumen Fidei</h1>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onMenuClick}
        data-testid="button-hamburger-menu"
      >
        <Menu className="w-6 h-6" />
      </Button>
    </div>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <>
      {open && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          data-testid="drawer-overlay"
        />
      )}
      <div 
        className={cn(
          "md:hidden fixed top-0 right-0 h-full w-72 bg-background border-l border-border flex flex-col p-6 z-50 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            data-testid="button-close-menu"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
        <SidebarContent onNavClick={onClose} />
      </div>
    </>
  );
}
