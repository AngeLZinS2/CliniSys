import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, FileText, User, LogOut, Menu, LayoutDashboard, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NavLink } from '@/components/NavLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationDropdown } from './NotificationDropdown';

const PatientLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/patient/dashboard' },
    { icon: Calendar, label: 'Meus Agendamentos', path: '/patient/appointments' },
    { icon: FileText, label: 'Histórico e Exames', path: '/patient/history' },
    { icon: User, label: 'Meu Perfil', path: '/patient/profile' },
    { icon: MessageSquare, label: 'Chat', path: '/patient/chat' },
  ];

  const MenuContent = () => (
    <nav className="space-y-2">
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold">CliniSys</h2>
                    <p className="text-sm text-muted-foreground">Portal do Paciente</p>
                  </div>
                  <MenuContent />
                </SheetContent>
              </Sheet>
              <h1 className="text-lg sm:text-xl font-bold">CliniSys</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationDropdown />
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{user?.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-2 mt-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PatientLayout;
