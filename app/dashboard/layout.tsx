'use client';

import { useEffect, useState, createContext, useContext, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { dbClient, Profile } from '@/lib/db';
import {
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
  Layers,
  Menu,
  X,
  Flame,
  Scale
} from 'lucide-react';

// User context for dashboard pages
interface UserContextType {
  user: Profile | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  refreshUser: async () => { },
});

export const useUser = () => useContext(UserContext);

function SidebarLinks({ user, onLinkClick }: { user: Profile; onLinkClick?: () => void }) {
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
        onClick={onLinkClick}
        className={`sidebar-link ${isLinkActive('/dashboard') ? 'active' : ''}`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Overview</span>
      </Link>

      <Link
        href="/dashboard/complaints"
        onClick={onLinkClick}
        className={`sidebar-link ${isLinkActive('/dashboard/complaints') ? 'active' : ''}`}
      >
        <ClipboardList className="w-4 h-4" />
        <span>FIR Complaints</span>
      </Link>

      {/* Bill Disputes - Dedicated Employee Section (NOT in FIR or Department) */}
      <Link
        href="/dashboard/bill-disputes"
        onClick={onLinkClick}
        className={`sidebar-link ${isLinkActive('/dashboard/bill-disputes') ? 'active' : ''}`}
        style={{
          color: isLinkActive('/dashboard/bill-disputes') ? '#0284c7' : undefined,
        }}
      >
        <Scale className="w-4 h-4 text-sky-600 flex-shrink-0" />
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Bill Disputes</span>
          <span style={{
            background: '#e0f2fe',
            color: '#0369a1',
            fontSize: '10px',
            fontWeight: '800',
            padding: '1px 6px',
            borderRadius: '10px',
            border: '1px solid #bae6fd'
          }}>
            Audit
          </span>
        </span>
      </Link>

      {/* Gas Leak Emergencies - Dedicated Employee Section (NOT in FIR or Department) */}
      <Link
        href="/dashboard/gas-leaks"
        onClick={onLinkClick}
        className={`sidebar-link ${isLinkActive('/dashboard/gas-leaks') ? 'active' : ''}`}
        style={{
          color: isLinkActive('/dashboard/gas-leaks') ? '#dc2626' : undefined,
        }}
      >
        <Flame className="w-4 h-4 text-red-500 flex-shrink-0" />
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Gas Leak Emergencies</span>
          <span style={{
            background: '#fee2e2',
            color: '#dc2626',
            fontSize: '10px',
            fontWeight: '800',
            padding: '1px 6px',
            borderRadius: '10px',
            border: '1px solid #fca5a5'
          }}>
            1199
          </span>
        </span>
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
              onClick={onLinkClick}
              className={`sidebar-link sub-link ${isLinkActive('/dashboard/sales-complaints') ? 'active' : ''}`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Sales Complaints</span>
            </Link>
            <Link
              href="/dashboard/billing-complaints"
              onClick={onLinkClick}
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
          onClick={onLinkClick}
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
          onClick={onLinkClick}
          className={`sidebar-link ${isLinkActive('/dashboard/users') ? 'active' : ''}`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts</span>
        </Link>
      )}

      <Link
        href="/dashboard/profile"
        onClick={onLinkClick}
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
  const pathname = usePathname();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

        {/* MOBILE TOPBAR (Visible only on <= 768px screens) */}
        <header className="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/dashboard" className="mobile-topbar-logo" onClick={() => setMobileMenuOpen(false)}>
              <div className="sngpl-logo-badge" style={{ width: '34px', height: '34px', padding: '2px' }}>
                <Image
                  src="/sngpl-logo.png"
                  alt="SNGPL Logo"
                  width={28}
                  height={28}
                  priority
                  className="sngpl-logo-img"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '15px', fontWeight: '800', lineHeight: '1.1', color: 'var(--text-primary)' }}>SNGPL</div>
                <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>Gas Portal</div>
              </div>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="sidebar-user-avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
              {user.role}
            </span>
          </div>
        </header>

        {/* MOBILE BACKDROP OVERLAY */}
        {mobileMenuOpen && (
          <div
            className="sidebar-backdrop animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* SIDEBAR NAVIGATION (Desktop Fixed & Mobile Slide-Out Drawer) */}
        <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <Link href="/dashboard" className="sidebar-logo" style={{ marginBottom: 0 }} onClick={() => setMobileMenuOpen(false)}>
              <div className="sngpl-logo-badge" style={{ width: '42px', height: '42px', padding: '3px', flexShrink: 0 }}>
                <Image
                  src="/sngpl-logo.png"
                  alt="SNGPL Logo"
                  width={34}
                  height={34}
                  priority
                  className="sngpl-logo-img"
                />
              </div>
              <div className="sidebar-logo-text">
                <div className="sidebar-logo-title">SUI NORTHERN</div>
                <div className="sidebar-logo-sub">Pipelines Limited</div>
              </div>
            </Link>
            <button
              type="button"
              className="sidebar-mobile-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <Suspense fallback={
            <nav className="sidebar-nav">
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading navigation...
              </div>
            </nav>
          }>
            <SidebarLinks user={user} onLinkClick={() => setMobileMenuOpen(false)} />
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

