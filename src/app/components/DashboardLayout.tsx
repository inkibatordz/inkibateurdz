import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
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
  Package
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
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

  const getNavItems = () => {
    if (role === 'student') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
        { icon: FolderKanban, label: 'Projets', path: '/student/projects' },
        { icon: Users, label: 'Mentorat', path: '/student/mentorship' },
        { icon: GraduationCap, label: 'Formations', path: '/student/trainings' },
        { icon: Package, label: 'Matériel', path: '/student/material' },
        { icon: Bell, label: 'Notifications', path: '/student/notifications', badge: 3 },
        { icon: User, label: 'Profil', path: '/student/profile' },
      ];
    } else if (role === 'mentor') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/mentor' },
        { icon: FolderKanban, label: 'Projets assignés', path: '/mentor/projects' },
        { icon: Calendar, label: 'Planification', path: '/mentor/scheduling' },
        { icon: BarChart3, label: 'Évaluations', path: '/mentor/evaluations' },
        { icon: Bell, label: 'Notifications', path: '/mentor/notifications', badge: 2 },
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
        { icon: Bell, label: 'Notifications', path: '/admin/notifications', badge: 5 },
      ];
    }
  };

  const navItems = getNavItems();

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getNotificationCount = () => {
    const item = navItems.find(item => item.label === 'Notifications');
    return item?.badge || 0;
  };

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie', {
      description: 'À bientôt !'
    });
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Incubator</h1>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Avatar>
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Bienvenue, {user?.firstName} !
            </h2>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {getNotificationCount() > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials()}
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

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto min-h-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
});


DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;