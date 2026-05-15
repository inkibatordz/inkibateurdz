import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  GraduationCap, 
  Bell, 
  User, 
  LogOut,
  Calendar,
  BarChart3,
  Settings,
  Package,
  Newspaper,
  Menu,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/ui/sheet";
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = React.memo(({ children }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'student';
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const userId = role === 'admin' ? 'admin' : user.id;
          const res = await fetch(`/api/notifications?userId=${userId}`);
          const data = await res.json();
          if (data.success && data.notifications) {
            setNotifications(data.notifications.slice(0, 3)); // Store top 3 for dropdown
            setUnreadCount(data.notifications.filter((n: any) => !n.is_read).length);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchNotifications();
    }
  }, [user, role]);

  const getNavItems = () => {
    if (role === 'student') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
        { icon: FolderKanban, label: 'Projets', path: '/student/projects' },
        { icon: Users, label: 'Mentorat', path: '/student/mentorship' },
        { icon: GraduationCap, label: 'Formations', path: '/student/trainings' },
        { icon: Package, label: 'Matériel', path: '/student/material' },
        { icon: Bell, label: 'Notifications', path: '/student/notifications', badge: unreadCount },
        { icon: User, label: 'Profil', path: '/student/profile' },
      ];
    } else if (role === 'mentor') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/mentor' },
        { icon: FolderKanban, label: 'Projets assignés', path: '/mentor/projects' },
        { icon: Users, label: 'Mentorat', path: '/mentor/mentorship' },
        { icon: Bell, label: 'Notifications', path: '/mentor/notifications', badge: unreadCount },
        { icon: User, label: 'Profil', path: '/mentor/profile' },
      ];
    } else {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Gestion des utilisateurs', path: '/admin/users' },
        { icon: FolderKanban, label: 'Gestion des projets', path: '/admin/projects' },
        { icon: GraduationCap, label: 'Formations', path: '/admin/trainings' },
        { icon: Package, label: 'Matériel', path: '/admin/material' },
        { icon: BarChart3, label: 'Statistiques', path: '/admin/statistics' },
        { icon: Newspaper, label: 'Actualités', path: '/admin/news' },
        { icon: Bell, label: 'Notifications', path: '/admin/notifications', badge: unreadCount },
      ];
    }
  };

  const navItems = getNavItems();

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getNotificationCount = () => unreadCount;

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie', {
      description: 'À bientôt !'
    });
    navigate('/login', { replace: true });
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = role === 'admin' ? 'admin' : user?.id;
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        toast.success('Toutes les notifications sont marquées comme lues');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-2xl border-r border-gray-100 safe-top safe-bottom">
      {/* Logo Section */}
      <div className="p-8 pb-4">
        <Link to="/" className="flex items-center space-x-3 group tap-active">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110">
            <Logo className="w-8 h-8 invert brightness-0" />
          </div>
          <div>
            <h1 className="font-black text-2xl text-gray-900 tracking-tighter leading-none">2TI</h1>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1 opacity-80 leading-none">
              Smart Incubator
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 opacity-50">Menu Principal</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-500 group relative tap-active ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200'
                  : 'text-gray-500 hover:bg-blue-50/50 hover:text-blue-600'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-all duration-500 ${isActive ? 'text-white' : 'group-hover:scale-110'}`} />
              <span className="flex-1 text-sm font-black tracking-tight">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge className={`rounded-xl px-2 py-0.5 text-[10px] font-black ${isActive ? 'bg-white/20 text-white border-0' : 'bg-orange-500 text-white shadow-lg shadow-orange-200'}`}>
                  {item.badge}
                </Badge>
              )}
              {isActive && (
                <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-white rounded-full ml-1" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section - Enhanced */}
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center space-x-3 mb-5 relative z-10">
            <Avatar className="w-11 h-11 ring-4 ring-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-base">
                {user?.firstName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900 truncate tracking-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[9px] font-black text-blue-600 truncate uppercase tracking-widest opacity-70 leading-none mt-0.5">{role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-gray-200 flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Bar - Elegant Glassmorphism */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Trigger - Styled */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden w-11 h-11 rounded-2xl hover:bg-gray-100 transition-colors">
                  <Menu className="w-6 h-6 text-gray-900" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tighter truncate max-w-[180px] sm:max-w-none">
                {user?.firstName ? `Hello, ${user.firstName} !` : 'Bienvenue !'}
              </h2>
              <p className="hidden sm:flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                <Calendar className="w-3 h-3 mr-2 text-blue-600" />
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long'
                })}
              </p>
            </div>
          </div>

        <div className="flex items-center space-x-4">
            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-blue-50 rounded-full transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[400px] rounded-3xl shadow-2xl border-gray-100 p-2">
                <DropdownMenuLabel className="flex items-center justify-between p-4">
                  <span className="text-base font-black tracking-tight">Notifications</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white border-0 font-bold text-[10px]">{unreadCount} nouvelles</Badge>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 px-2"
                        onClick={handleMarkAllAsRead}
                      >
                        Tout lire
                      </Button>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(notif => (
                    <DropdownMenuItem 
                      key={notif.id} 
                      className={`p-4 cursor-pointer border-b last:border-0 focus:bg-blue-50/50 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                      onClick={() => navigate(`/${role}/notifications`)}
                    >
                      <div className="w-full">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm tracking-tight ${!notif.is_read ? 'font-black text-gray-900' : 'font-medium text-gray-600'}`}>{notif.title}</p>
                          {!notif.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 shrink-0"></span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                          {new Date(notif.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )) : (
                    <div className="p-10 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aucune notification</p>
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    to={`/${role}/notifications`}
                    className="w-full flex items-center justify-center py-3 text-blue-600 hover:text-blue-700 cursor-pointer font-black text-[10px] uppercase tracking-[0.2em] text-center bg-gray-50/50"
                  >
                    Voir tout l'historique
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {user?.firstName?.[0] || user?.lastName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area - Premium Experience */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa] custom-scrollbar">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 animate-in fade-in duration-700">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
});


DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;