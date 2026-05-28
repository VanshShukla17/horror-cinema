'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skull, User, LogOut, Ticket, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import ScaryTransition from '@/components/ScaryTransition';

function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    window.location.href = '/';
  };

  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost"
        style={{ padding: '6px 14px', fontSize: '0.85rem', gap: '6px', display: 'flex', alignItems: 'center' }}
      >
        <User size={14} />
        {displayName}
        <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '6px',
              minWidth: '180px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              zIndex: 1000,
            }}
          >
            <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>{user?.email}</span>
              {user?.user_metadata?.age && (
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Age: {user.user_metadata.age}</span>
              )}
            </div>
            <Link
              href="/tickets"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem',
                borderRadius: 'var(--radius-sm)', transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Ticket size={15} /> My Bookings
            </Link>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                color: 'var(--blood-bright)', background: 'none', border: 'none',
                fontSize: '0.9rem', cursor: 'pointer', width: '100%', textAlign: 'left',
                borderRadius: 'var(--radius-sm)', transition: 'background 0.2s',
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--blood-subtle)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MainLayout({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  return (
    <>
      <nav className="nav-bar">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <Skull size={24} />
            CineMacabre
          </Link>
          <ul className="nav-links">
            <li><Link href="/" className={`nav-link ${pathname === '/' ? 'nav-link-active' : ''}`}>Home</Link></li>
            <li><Link href="/movies" className={`nav-link ${pathname.startsWith('/movies') ? 'nav-link-active' : ''}`}>Movies</Link></li>
            {user && (
              <li><Link href="/tickets" className={`nav-link ${pathname === '/tickets' ? 'nav-link-active' : ''}`}>My Bookings</Link></li>
            )}
            <li>
              {loading ? (
                <span className="nav-link" style={{ opacity: 0.5 }}>...</span>
              ) : user ? (
                <UserMenu />
              ) : (
                <Link href="/login" className="btn-ghost" style={{ padding: '6px 18px', fontSize: '0.85rem' }}>
                  Sign In
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>
      
      <ScaryTransition>
        {children}
      </ScaryTransition>
    </>
  );
}
