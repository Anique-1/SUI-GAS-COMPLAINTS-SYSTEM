'use client';

import { useEffect, useState, createContext, useContext, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { dbClient, Profile } from '@/lib/db';
import { 
  Flame, 
  LayoutDashboard, 
  ClipboardList, 
  UserCheck, 
  Settings, 
  LogOut, 
  Loader2,
  Users,
  ChevronDown,
  ChevronRight,
  DollarSign,
  ReceiptText,
  Layers
} from 'lucide-react';

// User context for dashboard pages
interface UserContextType {
  user: Profile | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

function SidebarLinks({ user }: { user: Profile }) {
  const pathname = usePathname();
  const isDeptActive = pathname.startsWith('/dashboard/sales-complaints') || pathname.startsWith('/dashboard/billing-complaints');
  const [deptOpen, setDeptOpen] = useState(isDeptActive);

  useEffect(() => {
    if (isDeptActive) {
      setDeptOpen(true);
    }
  }, [pathname, isDeptActive]);

  const isLinkActive = (path: string) => pathname === path;

  return (
    <nav className="sidebar-nav">
      <Link 
        href="/dashboard" 
        className={`sidebar-link ${isLinkActive('/dashboard') ? 'active' : ''}`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Overview</span>
      </Link>

      <Link 
        href="/dashboard/complaints" 
        className={`sidebar-link ${isLinkActive('/dashboard/complaints') ? 'active' : ''}`}
      >
        <ClipboardList className="w-4 h-4" />
        <span>FIR Complaints</span>
      </Link>

      <div className="sidebar-group">
        <button 
          onClick={() => setDeptOpen(!deptOpen)}
          className={`sidebar-link ${isDeptActive ? 'active' : ''}`}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers className="w-4 h-4" />
            <span>Department</span>
          </div>
          {deptOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {deptOpen && (
          <div className="sidebar-subnav">
            <Link 
              href="/dashboard/sales-complaints" 
              className={`sidebar-link sub-link ${isLinkActive('/dashboard/sales-complaints') ? 'active' : ''}`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Sales Complaints</span>
            </Link>
            <Link 
              href="/dashboard/billing-complaints" 
              className={`sidebar-link sub-link ${isLinkActive('/dashboard/billing-complaints') ? 'active' : ''}`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Billing Complaints</span>
            </Link>
          </div>
        )}
      </div>

      {/* Admin/Executive Only Approvals View */}
      {user.role === 'executive' && (
        <Link 
          href="/dashboard/approvals" 
          className={`sidebar-link ${isLinkActive('/dashboard/approvals') ? 'active' : ''}`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Approvals</span>
        </Link>
      )}

      {/* Admin/Executive Only User Accounts View */}
      {user.role === 'executive' && (
        <Link 
          href="/dashboard/users" 
          className={`sidebar-link ${isLinkActive('/dashboard/users') ? 'active' : ''}`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts</span>
        </Link>
      )}

      <Link 
        href="/dashboard/profile" 
        className={`sidebar-link ${isLinkActive('/dashboard/profile') ? 'active' : ''}`}
      >
        <Settings className="w-4 h-4" />
        <span>Profile Settings</span>
      </Link>
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const activeUser = await dbClient.getUser();
      if (!activeUser) {
        router.push('/login');
      } else {
        setUser(activeUser);
      }
    } catch (err) {
      console.error('Auth verification failed', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleSignOut = async () => {
    await dbClient.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" style={{ color: 'var(--accent-blue)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading secure session...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <UserContext.Provider value={{ user, refreshUser: checkUser }}>
      <div className="dashboard-container">
        {/* SIDEBAR NAVIGATION */}
        <aside className="sidebar">
          <Link href="/dashboard" className="sidebar-logo">
            <Flame className="w-6 h-6" style={{ color: 'var(--accent-blue)' }} />
            <span>SUI GAS</span>
          </Link>

          <Suspense fallback={
            <nav className="sidebar-nav">
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading navigation...
              </div>
            </nav>
          }>
            <SidebarLinks user={user} />
          </Suspense>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
            </div>
            
            <button 
              onClick={handleSignOut} 
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', gap: '8px', padding: '10px' }}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN DISPLAY AREA */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </UserContext.Provider>
  );
}
