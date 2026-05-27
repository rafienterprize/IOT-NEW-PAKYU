import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Lightbulb, CloudRain, DoorOpen, Settings, Wifi } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/esp1', icon: Lightbulb, label: 'ESP1 - Lamp & Gas' },
    { path: '/esp2', icon: CloudRain, label: 'ESP2 - Clothesline' },
    { path: '/esp3', icon: DoorOpen, label: 'ESP3 - Door & Gate' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-green-500">IoT Smart Home</h1>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-green-500" />
              <span className="text-sm text-gray-400">Connected</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
