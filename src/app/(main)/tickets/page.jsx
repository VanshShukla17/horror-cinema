'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Ticket, Calendar, Clock, MapPin, Skull, Film, Loader, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserBookings, cancelBooking } from '@/lib/bookings';

export default function TicketsPage() {
  const { user, loading: authLoading, signOut, updateWalletBalance } = useAuth();
  const router = useRouter();
  const [selectedQrBooking, setSelectedQrBooking] = useState(null);
  const [localIp, setLocalIp] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/local-ip')
      .then(res => res.json())
      .then(data => {
        if (data.ip) {
          setLocalIp(data.ip);
        }
      })
      .catch(err => console.error('Failed to fetch local IP', err));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/tickets');
      return;
    }

    async function fetchBookings() {
      setLoading(true);
      const { data, error } = await getUserBookings(user.id);
      if (error) {
        setError('Failed to load bookings.');
        console.error(error);
      } else {
        setBookings(data);
      }
      setLoading(false);
    }

    fetchBookings();
  }, [user, authLoading, router]);

  const handleCancelBooking = async (booking) => {
    if (confirm(`Are you sure you want to cancel your booking for "${booking.movie_title}"? A refund of ₹${booking.total_price} will be credited to your wallet.`)) {
      const { data, error } = await cancelBooking(booking.id);
      if (error) {
        alert('Failed to cancel booking: ' + error.message);
      } else {
        const currentBalance = (user.user_metadata && user.user_metadata.wallet_balance) !== undefined
          ? user.user_metadata.wallet_balance
          : 500;
        const newBalance = currentBalance + booking.total_price;
        updateWalletBalance(newBalance);
        
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
        alert(`Booking cancelled successfully. ₹${booking.total_price} has been refunded to your wallet.`);
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (authLoading || loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader size={32} color="var(--blood)" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: '32px 24px 80px', maxWidth: '800px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}
        >
          <div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '4px' }}>My Bookings</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
              {user && <span> • {user.email}</span>}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-ghost"
            onClick={handleLogout}
            style={{ fontSize: '0.85rem' }}
          >
            <LogOut size={14} /> Sign Out
          </motion.button>
        </motion.div>

        {/* Error State */}
        {error && (
          <div style={{ padding: '16px', background: 'var(--blood-subtle)', border: '1px solid var(--border-hover)', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: 'var(--blood-bright)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Empty State */}
        {bookings.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 0' }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ marginBottom: '20px' }}
            >
              <Ticket size={56} color="var(--text-muted)" />
            </motion.div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>No Bookings Yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You haven't sealed your fate with any screenings.</p>
            <button className="btn-blood" onClick={() => router.push('/movies')} style={{ padding: '12px 28px' }}>
              Browse Movies
            </button>
          </motion.div>
        )}

        {/* Bookings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="ticket-card"
              whileHover={{ scale: 1.01 }}
            >
              {/* Top section */}
              <div style={{ padding: '24px 28px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 className="creepy-font" style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#fff' }}>
                      {booking.movie_title}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} /> {booking.theater_name}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                    background: booking.status === 'confirmed' ? 'rgba(74,222,128,0.1)' : 'var(--blood-subtle)',
                    color: booking.status === 'confirmed' ? '#4ade80' : 'var(--blood-bright)',
                    fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                  }}>
                    {booking.status}
                  </div>
                </div>
              </div>

              <hr className="ticket-divider" />

              {/* Bottom section */}
              <div style={{ padding: '18px 28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Date</div>
                    <div style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--blood)" />
                      {new Date(booking.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Time</div>
                    <div style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="var(--blood)" /> {booking.show_time}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Seats</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(booking.seats || []).map(s => (
                        <span key={s} style={{
                          padding: '2px 10px', background: 'var(--blood-subtle)',
                          border: '1px solid var(--border-hover)', borderRadius: '4px',
                          fontSize: '0.85rem', fontWeight: 600
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {booking.status === 'confirmed' && (
                    <button
                      className="btn-ghost"
                      onClick={() => handleCancelBooking(booking)}
                      style={{
                        padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                        color: 'var(--blood-bright)', border: '1px solid var(--blood-subtle)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      Cancel Booking
                    </button>
                  )}
                  <button
                    className="btn-blood"
                    onClick={() => setSelectedQrBooking(booking)}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Skull size={13} /> Gate QR
                  </button>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--blood-bright)' }}>₹{booking.total_price?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Warning / Cancellation Info */}
        {bookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: '48px', textAlign: 'center', padding: '24px',
              border: '1px dashed var(--border-hover)', borderRadius: 'var(--radius-lg)',
              background: 'var(--blood-subtle)',
            }}
          >
            <Skull size={32} color="var(--blood)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontFamily: "'Cinzel', serif", marginBottom: '6px', color: 'var(--text-primary)' }}>TICKET CANCELLATION & REFUNDS</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              You may cancel any active booking. A full refund will be credited directly to your website wallet for future bookings.
            </p>
          </motion.div>
        )}
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {selectedQrBooking && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10000, padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass"
              style={{ padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center', border: '1px solid var(--border-hover)' }}
            >
              <h3 className="creepy-font" style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#fff' }}>
                {selectedQrBooking.movie_title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {selectedQrBooking.theater_name} • {selectedQrBooking.show_time}
              </p>

              {/* QR Image */}
              <div style={{
                background: '#fff', padding: '12px', borderRadius: '12px',
                display: 'inline-block', marginBottom: '16px',
                boxShadow: '0 0 20px rgba(139,0,0,0.3)', border: '4px solid var(--blood)'
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=8b0000&data=${encodeURIComponent(
                    localIp.trim()
                      ? `http://${localIp.trim()}:3000/tickets/scan?id=${selectedQrBooking.id}&title=${encodeURIComponent(selectedQrBooking.movie_title)}&theater=${encodeURIComponent(selectedQrBooking.theater_name)}&scans=${selectedQrBooking.seats.length}`
                      : `${window.location.origin}/tickets/scan?id=${selectedQrBooking.id}&title=${encodeURIComponent(selectedQrBooking.movie_title)}&theater=${encodeURIComponent(selectedQrBooking.theater_name)}&scans=${selectedQrBooking.seats.length}`
                  )}`}
                  alt="Entry Gate QR Code"
                  style={{ display: 'block', width: '180px', height: '180px' }}
                />
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                Remaining Entries: <span style={{ color: 'var(--blood-bright)' }}>{selectedQrBooking.remaining_scans !== undefined ? selectedQrBooking.remaining_scans : selectedQrBooking.seats.length}</span> / {selectedQrBooking.seats.length}
              </div>

              {/* Local IP Helper Input */}
              <div style={{
                marginTop: '8px', marginBottom: '20px', background: 'rgba(255,255,255,0.02)',
                padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                textAlign: 'left'
              }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Scanning on phone? Set local IP
                </label>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>http://</span>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.10"
                    className="input-dark"
                    value={localIp}
                    onChange={(e) => setLocalIp(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1 }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>:3000</span>
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px', lineHeight: 1.3 }}>
                  Type your computer's local IP address so your phone can reach the scanner page.
                </span>
              </div>

              <button
                className="btn-blood"
                onClick={() => {
                  const paramsStr = `?id=${selectedQrBooking.id}&title=${encodeURIComponent(selectedQrBooking.movie_title)}&theater=${encodeURIComponent(selectedQrBooking.theater_name)}&scans=${selectedQrBooking.seats.length}`;
                  const url = localIp.trim()
                    ? `http://${localIp.trim()}:3000/tickets/scan${paramsStr}`
                    : `/tickets/scan${paramsStr}`;
                  window.open(url, '_blank');
                }}
                style={{
                  width: '100%', padding: '12px', marginBottom: '10px',
                  background: 'transparent', border: '1px solid var(--blood)',
                  color: 'var(--blood-bright)', cursor: 'pointer',
                  fontWeight: 600, transition: 'var(--transition)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--blood)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--blood-bright)'; }}
              >
                Simulate Scan (Open in New Tab)
              </button>

              <button className="btn-blood" onClick={() => setSelectedQrBooking(null)} style={{ width: '100%', padding: '12px' }}>
                Close Gate Pass
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
