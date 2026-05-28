'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, UserCheck, Loader } from 'lucide-react';
import { getBookingById, updateBookingScans } from '@/lib/bookings';

function ScanContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id') || 'book_demo';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [showScanSuccess, setShowScanSuccess] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      let { data, error } = await getBookingById(bookingId);
      if (error || !data) {
        console.warn('Booking not found in local registers. Creating a mock from query parameters.');
        
        const qTitle = searchParams.get('title') || 'The Haunting Shadows (Demo Ticket)';
        const qTheater = searchParams.get('theater') || 'Crypt Cinemas (Screen 2)';
        const qScans = parseInt(searchParams.get('scans') || '3');

        // Create a mock booking for demonstration (e.g. if scanned on another device like a phone)
        data = {
          id: bookingId,
          movie_id: '1',
          movie_title: qTitle,
          theater_name: qTheater,
          show_date: new Date().toISOString().split('T')[0],
          show_time: '7:15 PM',
          seats: Array.from({ length: qScans }, (_, i) => `Seat-${i + 1}`),
          remaining_scans: qScans
        };
        // Store it locally in the scanning browser so it persists updates
        const localBookings = JSON.parse(localStorage.getItem('macabre_bookings') || '[]');
        const existing = localBookings.find(b => b.id === bookingId);
        if (!existing) {
          localBookings.push(data);
          localStorage.setItem('macabre_bookings', JSON.stringify(localBookings));
        } else {
          // If it exists now, load it
          data = existing;
        }
      }
      setBooking(data);
      setLoading(false);
    }

    loadBooking();
  }, [bookingId]);

  const handleCheckboxChange = async (e) => {
    const checked = e.target.checked;
    setCheckboxChecked(checked);

    if (checked && booking) {
      const currentRemaining = booking.remaining_scans !== undefined ? booking.remaining_scans : booking.seats.length;
      if (currentRemaining <= 0) {
        alert('No entries remaining on this ticket!');
        setCheckboxChecked(false);
        return;
      }

      setIsUpdating(true);
      const newCount = currentRemaining - 1;
      const { data, error } = await updateBookingScans(booking.id, newCount);

      if (error) {
        alert('Failed to register scan: ' + error.message);
        setCheckboxChecked(false);
      } else {
        // Update local state
        setBooking(data);
        setShowScanSuccess(true);
        setTimeout(() => {
          setCheckboxChecked(false);
          setShowScanSuccess(false);
        }, 1500);
      }
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader size={32} color="var(--blood)" />
        </motion.div>
      </div>
    );
  }

  const totalScans = booking.seats.length;
  const remainingScans = booking.remaining_scans !== undefined ? booking.remaining_scans : totalScans;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: '40px 24px 80px', maxWidth: '500px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{ padding: '36px', border: `1px solid ${remainingScans > 0 ? 'var(--border)' : 'var(--blood)'}`, textAlign: 'center' }}
        >
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <Skull size={36} color={remainingScans > 0 ? 'var(--text-secondary)' : 'var(--blood)'} style={{ marginBottom: '12px' }} />
            <h1 className="creepy-font" style={{ fontSize: '2rem', letterSpacing: '2px', color: '#fff' }}>Gate Entry Scanner</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Metro-style decrementing ticket scanner</p>
          </div>

          {/* Booking Info Card */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'left', marginBottom: '28px' }}>
            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.2rem', marginBottom: '12px', color: 'var(--blood-bright)' }}>{booking.movie_title}</h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Theater:</strong> {booking.theater_name}</div>
              <div><strong>Time:</strong> {booking.show_time}</div>
              <div><strong>Seats:</strong> {booking.seats.join(', ')}</div>
            </div>
          </div>

          {/* Scanning Box */}
          <div style={{
            background: remainingScans > 0 ? 'rgba(74,222,128,0.02)' : 'rgba(139,0,0,0.05)',
            border: `1px dashed ${remainingScans > 0 ? 'rgba(74,222,128,0.2)' : 'var(--blood)'}`,
            borderRadius: 'var(--radius-lg)', padding: '28px 20px', marginBottom: '24px',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Status light */}
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: remainingScans > 0 ? '#4ade80' : 'var(--blood)',
              boxShadow: remainingScans > 0 ? '0 0 10px #4ade80' : '0 0 10px var(--blood)',
              position: 'absolute', top: '16px', right: '16px'
            }} />

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              TICKET ADMITTANCE COUNT
            </div>
            
            {/* Count Display */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: remainingScans > 0 ? '#fff' : 'var(--blood-bright)', transition: 'color 0.3s' }}>
                {remainingScans}
              </span>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {totalScans} remaining</span>
            </div>

            {/* Checkbox Scan Action */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                cursor: (isUpdating || remainingScans <= 0) ? 'not-allowed' : 'pointer',
                padding: '12px 24px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', userSelect: 'none', transition: 'var(--transition)',
                fontWeight: 600,
                color: remainingScans <= 0 ? 'var(--blood-bright)' : checkboxChecked ? '#4ade80' : 'var(--text-secondary)',
                opacity: remainingScans <= 0 ? 0.6 : 1
              }}
                onMouseOver={(e) => !isUpdating && remainingScans > 0 && (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)')}
                onMouseOut={(e) => !isUpdating && remainingScans > 0 && (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <input
                  type="checkbox"
                  checked={remainingScans <= 0 ? true : checkboxChecked}
                  onChange={handleCheckboxChange}
                  disabled={isUpdating || showScanSuccess || remainingScans <= 0}
                  style={{
                    width: '20px', height: '20px', accentColor: 'var(--blood)',
                    cursor: remainingScans <= 0 ? 'not-allowed' : 'pointer'
                  }}
                />
                {remainingScans <= 0
                  ? 'Access Denied (Exhausted)'
                  : isUpdating
                    ? 'Recording Admittance...'
                    : checkboxChecked
                      ? 'Scan Logged!'
                      : 'Admit 1 Person'}
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {remainingScans <= 0
                  ? 'All entries for this ticket have been scanned.'
                  : 'Tick the checkbox to decrease count and admit passenger.'}
              </span>
            </div>
          </div>

          {/* Success Overlay Animation */}
          <AnimatePresence>
            {showScanSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  color: '#4ade80', fontSize: '0.95rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: 'rgba(74,222,128,0.1)', padding: '10px', borderRadius: 'var(--radius-sm)'
                }}
              >
                <UserCheck size={18} /> Admittance Success. Count updated.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Loader size={32} color="var(--blood)" />
      </div>
    }>
      <ScanContent />
    </Suspense>
  );
}
