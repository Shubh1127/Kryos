'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { 
  Shield, 
  Users, 
  Key, 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  Bell,
  LogOut,
  Menu,
  X,
  Eye,
  TrendingUp,
  Globe,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Import dashboard components (we'll create these)
import { DashboardOverview } from '@/components/dashboard/overview';
import { ApiKeyManagement } from '@/components/dashboard/api-keys';
import { RealTimeMonitoring } from '@/components/dashboard/monitoring';
import { SecurityAlerts } from '@/components/dashboard/security';
import { Analytics } from '@/components/dashboard/analytics';
import { WatchlistManagement } from '@/components/dashboard/watchlist';
import { Settings as SystemSettings } from '@/components/dashboard/settings';

type DashboardSection = 
  | 'overview' 
  | 'api-keys' 
  | 'monitoring' 
  | 'security' 
  | 'analytics' 
  | 'watchlist' 
  | 'settings';

const navigation = [
  { id: 'overview', name: 'Overview', icon: BarChart3 },
  { id: 'api-keys', name: 'API Keys', icon: Key },
  { id: 'monitoring', name: 'Real-time Monitoring', icon: Activity },
  { id: 'security', name: 'Security Alerts', icon: AlertTriangle },
  { id: 'analytics', name: 'Analytics & Reports', icon: TrendingUp },
  { id: 'watchlist', name: 'Watchlist', icon: Eye },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export default function Dashboard() {
  const { company, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <Shield className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <div className="text-lg">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !company) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />;
      case 'api-keys':
        return <ApiKeyManagement />;
      case 'monitoring':
        return <RealTimeMonitoring />;
      case 'security':
        return <SecurityAlerts />;
      case 'analytics':
        return <Analytics />;
      case 'watchlist':
        return <WatchlistManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-64'} bg-slate-900 border-r border-slate-800`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-purple-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Kryos</h2>
            <p className="text-xs text-slate-400">Security Platform</p>
          </div>
        </div>
        {mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Company Info */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback className="bg-purple-600 text-white">
              {company.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{company.name}</p>
            <p className="text-xs text-slate-400 truncate">{company.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id as DashboardSection);
                if (mobile) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white">
              <Settings className="h-4 w-4 mr-2" />
              <span className="text-sm">Account</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setActiveSection('settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 bg-slate-900 border-slate-800">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden text-slate-400 hover:text-white"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {navigation.find(nav => nav.id === activeSection)?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-slate-400">
                  {company.name} Security Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-600 text-xs">
                  3
                </Badge>
              </Button>

              {/* Status Indicators */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-400">API Status: Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  <span className="text-slate-400">Monitoring: Live</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}