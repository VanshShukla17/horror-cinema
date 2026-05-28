'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Star, Clock, Film, Users, Calendar, MapPin, ChevronRight, Ticket, AlertTriangle, Skull } from 'lucide-react';
import { movies, theaters, showtimes, getNextDates } from '@/data/movies';
import { useAuth } from '@/context/AuthContext';
import { createBooking } from '@/lib/bookings';

const STEPS = { INFO: 0, SHOWTIME: 1, SEATS: 2, PAYMENT: 3, SUMMARY: 4 };

// Generate random sold seats
const generateSoldSeats = () => {
  const sold = new Set();
  const count = Math.floor(Math.random() * 15) + 5;
  for (let i = 0; i < count; i++) {
    sold.add(Math.floor(Math.random() * 80) + 1);
  }
  return sold;
};

export default function MovieDetailPage({ params }) {
  const router = useRouter();
  const { user, updateWalletBalance } = useAuth();
  const movie = movies.find(m => m.id === params.id) || movies[0];
  const dates = useMemo(() => getNextDates(7), []);
  const soldSeats = useMemo(() => generateSoldSeats(), []);

  const [step, setStep] = useState(STEPS.INFO);
  const [useWallet, setUseWallet] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dates[0].full);
    const [selectedTheater, setSelectedTheater] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'card'
    const [upiOption, setUpiOption] = useState('gpay'); // 'gpay', 'phonepe', 'paytm', 'other'
    const [upiId, setUpiId] = useState('');
    const [cardNo, setCardNo] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

  const seatRows = [
    { label: 'PREMIUM', rows: ['A', 'B', 'C'], cols: 16, priceKey: 'premium' },
    { label: 'EXECUTIVE', rows: ['D', 'E', 'F', 'G'], cols: 16, priceKey: 'executive' },
    { label: 'NORMAL', rows: ['H', 'I', 'J', 'K', 'L'], cols: 16, priceKey: 'normal' },
  ];

  const toggleSeat = (seatId) => {
    if (soldSeats.has(parseInt(seatId.split('-')[1]))) return;
    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  const getSeatPrice = (seatId) => {
    const row = seatId.split('-')[0];
    for (const section of seatRows) {
      if (section.rows.includes(row)) return movie.price[section.priceKey];
    }
    return 0;
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s), 0);
  const gstAmount = Math.round(totalPrice * 0.18);
  const bookingTotalPrice = totalPrice + gstAmount;
  const walletBalance = user?.user_metadata?.wallet_balance !== undefined
    ? user.user_metadata.wallet_balance
    : 500;
  const walletDeduction = useWallet ? Math.min(bookingTotalPrice, walletBalance) : 0;
  const remainingPrice = bookingTotalPrice - walletDeduction;

  const handleBook = async () => {
    if (!user) {
      router.push(`/login?redirect=/movies/${movie.id}`);
      return;
    }
    const userAge = user?.user_metadata?.age;
    if (movie.certification === 'A' && userAge && parseInt(userAge) < 18) {
      setBookingError("Age Restriction: You must be 18 or older to book tickets for 'A' certified movies.");
      return;
    }

    // Payment validation
    if (remainingPrice > 0) {
      if (paymentMethod === 'upi') {
        if (upiOption === 'other' && !upiId.trim()) {
          setBookingError("Please enter your UPI ID.");
          return;
        }
      } else {
        if (!cardNo.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
          setBookingError("Please fill in all card details.");
          return;
        }
      }
    }

    setIsBooking(true);
    setBookingError('');

    const theaterObj = theaters.find(t => t.id === selectedTheater);
    const { data, error } = await createBooking({
      userId: user.id,
      movieId: movie.id,
      movieTitle: movie.title,
      theaterName: theaterObj?.name || 'Unknown',
      showDate: selectedDate,
      showTime: selectedTime,
      seats: selectedSeats,
      totalPrice: bookingTotalPrice,
    });

    if (error) {
      console.error('Booking error:', error);
      setBookingError(error.message || 'Booking failed. Please try again.');
      setIsBooking(false);
      return;
    }

    if (walletDeduction > 0) {
      updateWalletBalance(walletBalance - walletDeduction);
    }

    setStep(STEPS.SUMMARY);
    setIsBooking(false);
  };

  const handleStartBooking = () => {
    if (!user) {
      router.push(`/login?redirect=/movies/${movie.id}`);
      return;
    }
    const userAge = user?.user_metadata?.age;
    if (movie.certification === 'A' && userAge && parseInt(userAge) < 18) {
      alert("This movie is 'A' certified. You must be 18 or older to book tickets.");
      return;
    }
    setStep(STEPS.SHOWTIME);
  };

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
  };

  return (
    <div className="page-wrapper">

      {/* ===== BACKDROP ===== */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '50vh', zIndex: -1,
        backgroundImage: `url(${movie.banner})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(30px) brightness(0.2) saturate(0.6)',
        maskImage: 'linear-gradient(to bottom, black, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
      }} />

      <div className="container" style={{ paddingBottom: '100px' }}>

        {/* ===== MOVIE INFO HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: '32px', marginBottom: '40px', flexWrap: 'wrap' }}
        >
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{ flex: '0 0 260px' }}
          >
            <img
              src={movie.image}
              alt={movie.title}
              style={{
                width: '100%', borderRadius: 'var(--radius-lg)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                border: '1px solid var(--border)',
              }}
            />
          </motion.div>

          {/* Details */}
          <div style={{ flex: '1 1 400px', paddingTop: '8px' }}>
            <h1 className="creepy-font" style={{ fontSize: '3rem', marginBottom: '12px', color: '#fff' }}>
              {movie.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span className="rating-badge" style={{ fontSize: '0.9rem', padding: '4px 12px' }}>
                <Star size={14} fill="#4ade80" /> {movie.rating}/5
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{movie.votes} votes</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span className="genre-tag" style={{ fontSize: '0.85rem' }}><Clock size={12} style={{ marginRight: '4px' }} />{movie.duration}</span>
              {movie.genre.map(g => <span key={g} className="genre-tag" style={{ fontSize: '0.85rem' }}>{g}</span>)}
              <span className="genre-tag" style={{ fontSize: '0.85rem' }}>{movie.language}</span>
              <span className="genre-tag" style={{ fontSize: '0.85rem', color: 'var(--blood-bright)' }}>{movie.certification}</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px', fontSize: '0.95rem' }}>
              {movie.synopsis}
            </p>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Director:</span> {movie.director}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Cast:</span> {movie.cast.join(', ')}</div>
            </div>

            {step === STEPS.INFO && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-blood"
                style={{ padding: '14px 36px', fontSize: '1rem' }}
                onClick={handleStartBooking}
              >
                <Ticket size={18} /> {user ? 'Book Tickets' : 'Sign In to Book'}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ===== BOOKING FLOW ===== */}
        <AnimatePresence mode="wait">

          {/* STEP 1: SELECT DATE + SHOWTIME */}
          {step === STEPS.SHOWTIME && (
            <motion.div key="showtime" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div className="glass" style={{ padding: '32px' }}>

                {/* Date Picker */}
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}>
                  <Calendar size={20} color="var(--blood)" /> Select Date
                </h3>
                <div className="date-picker" style={{ marginBottom: '36px' }}>
                  {dates.map(d => (
                    <motion.button
                      key={d.full}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`date-chip ${selectedDate === d.full ? 'date-chip-active' : ''}`}
                      onClick={() => setSelectedDate(d.full)}
                    >
                      <span className="date-chip-day">{d.isToday ? 'TODAY' : d.day}</span>
                      <span className="date-chip-date">{d.date}</span>
                      <span className="date-chip-month">{d.month}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Theaters + Showtimes */}
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}>
                  <MapPin size={20} color="var(--blood)" /> Select Theater & Showtime
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {theaters.map(theater => (
                    <div key={theater.id} style={{
                      padding: '20px 24px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${selectedTheater === theater.id ? 'var(--border-hover)' : 'var(--border)'}`,
                      transition: 'var(--transition)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <h4 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', marginBottom: '4px' }}>{theater.name}</h4>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{theater.location} • {theater.screens} Screens</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {showtimes.map(time => {
                          const isActive = selectedTheater === theater.id && selectedTime === time;
                          return (
                            <motion.button
                              key={time}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`showtime-btn ${isActive ? 'showtime-btn-active' : ''}`}
                              onClick={() => { setSelectedTheater(theater.id); setSelectedTime(time); }}
                            >
                              {time}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                  <motion.button
                    whileHover={selectedTime ? { scale: 1.02 } : {}}
                    whileTap={selectedTime ? { scale: 0.98 } : {}}
                    className="btn-blood"
                    disabled={!selectedTime}
                    onClick={() => setStep(STEPS.SEATS)}
                    style={{ padding: '12px 32px' }}
                  >
                    Select Seats <ChevronRight size={16} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SEAT SELECTION */}
          {step === STEPS.SEATS && (
            <motion.div key="seats" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div className="glass" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}>
                    <Users size={20} color="var(--blood)" /> Select Seats
                  </h3>
                  <button className="btn-ghost" onClick={() => setStep(STEPS.SHOWTIME)} style={{ fontSize: '0.85rem' }}>
                    ← Change Showtime
                  </button>
                </div>

                {/* Screen indicator */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{
                    width: '60%', maxWidth: '400px', height: '6px', margin: '0 auto 12px',
                    background: 'linear-gradient(90deg, transparent, var(--blood), transparent)',
                    borderRadius: '0 0 50% 50%',
                    boxShadow: '0 0 30px var(--blood-glow), 0 0 60px rgba(139,0,0,0.1)',
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '3px', textTransform: 'uppercase' }}>
                    Screen This Way
                  </span>
                </div>

                {/* Seat Map */}
                <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
                  {seatRows.map((section, si) => (
                    <div key={section.label} style={{ marginBottom: '24px' }}>
                      <div style={{
                        fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '2px',
                        textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                      }}>
                        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        {section.label} — ₹{movie.price[section.priceKey]}
                        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                      </div>
                      {section.rows.map(row => {
                        const globalRowIdx = seatRows.slice(0, si).reduce((sum, s) => sum + s.rows.length, 0) +
                          section.rows.indexOf(row);
                        return (
                          <div key={row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                            <span style={{ width: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{row}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {Array.from({ length: section.cols }, (_, col) => {
                                const seatNum = globalRowIdx * section.cols + col + 1;
                                const seatId = `${row}-${seatNum}`;
                                const isSold = soldSeats.has(seatNum);
                                const isSelected = selectedSeats.includes(seatId);
                                // Add aisle gap
                                const hasGap = col === 3 || col === 11;
                                return (
                                  <div key={col} style={{ display: 'flex', gap: '4px' }}>
                                    <motion.button
                                      whileHover={!isSold ? { scale: 1.2 } : {}}
                                      whileTap={!isSold ? { scale: 0.9 } : {}}
                                      className={`seat ${isSold ? 'seat-sold' : isSelected ? 'seat-selected' : 'seat-available'}`}
                                      onClick={() => !isSold && toggleSeat(seatId)}
                                      disabled={isSold}
                                    >
                                      {col + 1}
                                    </motion.button>
                                    {hasGap && <div style={{ width: '12px' }} />}
                                  </div>
                                );
                              })}
                            </div>
                            <span style={{ width: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{row}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="seat-legend">
                  <div className="seat-legend-item">
                    <div className="seat-legend-box" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                    Available
                  </div>
                  <div className="seat-legend-item">
                    <div className="seat-legend-box" style={{ background: 'var(--blood)', boxShadow: '0 0 8px var(--blood-glow)' }} />
                    Selected
                  </div>
                  <div className="seat-legend-item">
                    <div className="seat-legend-box" style={{ background: 'rgba(255,255,255,0.03)' }} />
                    Sold
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Bar */}
              <AnimatePresence>
                {selectedSeats.length > 0 && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    style={{
                      position: 'fixed', bottom: 0, left: 0, right: 0,
                      background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)',
                      borderTop: '1px solid var(--border)', zIndex: 100,
                      padding: '16px 0',
                    }}
                  >
                    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {selectedSeats.length} Ticket{selectedSeats.length > 1 ? 's' : ''} Selected
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                          ₹{totalPrice.toLocaleString()}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-blood"
                        onClick={() => setStep(STEPS.PAYMENT)}
                        style={{ padding: '14px 36px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Proceed to Payment <ChevronRight size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === STEPS.PAYMENT && (
            <motion.div key="payment" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div style={{
                display: 'flex',
                gap: '24px',
                maxWidth: '900px',
                margin: '0 auto',
                flexWrap: 'wrap-reverse',
                alignItems: 'stretch'
              }}>
                {/* Left Side: Payment Page */}
                <div className="glass" style={{ flex: '1 1 500px', padding: '32px', minWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem', fontFamily: "'Cinzel', serif", margin: 0 }}>
                        <Skull size={20} color="var(--blood)" /> Sacrifice Offering
                      </h3>
                      <button className="btn-ghost" onClick={() => setStep(STEPS.SEATS)} style={{ fontSize: '0.85rem' }}>
                        ← Back to Seats
                      </button>
                    </div>

                    {/* Wallet Offer Option */}
                    {walletBalance > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '16px', borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                        marginBottom: '24px'
                      }}>
                        <input
                          type="checkbox"
                          id="use-wallet"
                          checked={useWallet}
                          onChange={(e) => {
                            setUseWallet(e.target.checked);
                            setBookingError('');
                          }}
                          style={{
                            width: '18px', height: '18px', cursor: 'pointer',
                            accentColor: 'var(--blood)'
                          }}
                        />
                        <label htmlFor="use-wallet" style={{ flex: 1, fontSize: '0.9rem', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
                          <span>Use In-built Wallet</span>
                          <span style={{ fontWeight: 600, color: 'var(--blood-bright)' }}>Available: ₹{walletBalance}</span>
                        </label>
                      </div>
                    )}

                    {/* Payment Option Toggle and Details */}
                    {remainingPrice > 0 ? (
                      <>
                        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px', gap: '4px', marginBottom: '24px' }}>
                          <button
                            type="button"
                            onClick={() => { setPaymentMethod('upi'); setBookingError(''); }}
                            style={{
                              flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                              fontWeight: 600, fontSize: '0.9rem', transition: 'var(--transition)',
                              background: paymentMethod === 'upi' ? 'var(--blood)' : 'transparent',
                              color: paymentMethod === 'upi' ? '#fff' : 'var(--text-muted)',
                            }}
                          >
                            UPI Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPaymentMethod('card'); setBookingError(''); }}
                            style={{
                              flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                              fontWeight: 600, fontSize: '0.9rem', transition: 'var(--transition)',
                              background: paymentMethod === 'card' ? 'var(--blood)' : 'transparent',
                              color: paymentMethod === 'card' ? '#fff' : 'var(--text-muted)',
                            }}
                          >
                            Card Payment
                          </button>
                        </div>

                        {/* Payment Inputs */}
                        {paymentMethod === 'upi' ? (
                          <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Select UPI App</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                              {['gpay', 'phonepe', 'paytm', 'other'].map(provider => {
                                const label = { gpay: 'Google Pay', phonepe: 'PhonePe', paytm: 'Paytm', other: 'Custom UPI' }[provider];
                                return (
                                  <button
                                    key={provider}
                                    type="button"
                                    onClick={() => setUpiOption(provider)}
                                    style={{
                                      padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid',
                                      borderColor: upiOption === provider ? 'var(--blood)' : 'var(--border)',
                                      background: upiOption === provider ? 'var(--blood-subtle)' : 'var(--bg-card)',
                                      color: upiOption === provider ? '#fff' : 'var(--text-secondary)',
                                      cursor: 'pointer', transition: 'var(--transition)', fontWeight: 500, fontSize: '0.85rem'
                                    }}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>

                            {upiOption === 'other' && (
                              <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Enter UPI ID</label>
                                <input
                                  type="text"
                                  className="input-dark"
                                  placeholder="username@upi"
                                  value={upiId}
                                  onChange={(e) => setUpiId(e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Card Number</label>
                              <input
                                type="text"
                                className="input-dark"
                                placeholder="4111 2222 3333 4444"
                                value={cardNo}
                                onChange={(e) => setCardNo(e.target.value)}
                                maxLength="19"
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Expiry</label>
                                <input
                                  type="text"
                                  className="input-dark"
                                  placeholder="MM/YY"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                  maxLength="5"
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>CVV</label>
                                <input
                                  type="password"
                                  className="input-dark"
                                  placeholder="•••"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value)}
                                  maxLength="3"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{
                        padding: '24px 16px', borderRadius: 'var(--radius-md)',
                        background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)',
                        color: '#4ade80', fontSize: '0.95rem', marginBottom: '24px',
                        textAlign: 'center', lineHeight: '1.5'
                      }}>
                        Wallet balance covers the entire ticket amount. No other payment options are required!
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Errors display */}
                    {bookingError && (
                      <div style={{ color: 'var(--blood-bright)', fontSize: '0.85rem', marginBottom: '16px', background: 'var(--blood-subtle)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hover)' }}>
                        {bookingError}
                      </div>
                    )}

                    {/* Pay Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="btn-blood"
                      onClick={handleBook}
                      disabled={isBooking}
                      style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 600 }}
                    >
                      {isBooking ? (
                        <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                          Sealing Fate (Processing payment)...
                        </motion.span>
                      ) : (
                        <>Authorize Sacrifice of ₹{remainingPrice.toLocaleString()}</>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Right Side: Movie Bill */}
                <div className="glass" style={{ flex: '0 1 350px', padding: '32px', minWidth: '300px', height: 'fit-content' }}>
                  <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.2rem', marginBottom: '20px', color: 'var(--blood-bright)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    Booking Bill
                  </h3>

                  {/* Movie Poster & Title */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <img
                      src={movie.image}
                      alt={movie.title}
                      style={{ width: '70px', height: '95px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 className="creepy-font" style={{ fontSize: '1.2rem', margin: '0 0 4px 0', color: '#fff', lineHeight: 1.2 }}>{movie.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{movie.certification} • {movie.language}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>
                        {selectedSeats.length} Ticket{selectedSeats.length > 1 ? 's' : ''}: {selectedSeats.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Base Ticket Cost</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>GST (18%)</span>
                      <span>₹{gstAmount.toLocaleString()}</span>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 600 }}>
                      <span>Subtotal</span>
                      <span>₹{bookingTotalPrice.toLocaleString()}</span>
                    </div>

                    {useWallet && walletDeduction > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                        <span>Wallet Discount</span>
                        <span>- ₹{walletDeduction.toLocaleString()}</span>
                      </div>
                    )}

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--blood-bright)', fontWeight: 700, fontSize: '1.2rem' }}>
                      <span>Amount Payable</span>
                      <span>₹{remainingPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: BOOKING CONFIRMATION */}
          {step === STEPS.SUMMARY && (
            <motion.div key="summary" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>

                {/* Success animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  style={{ marginBottom: '24px' }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Skull size={64} color="var(--blood)" />
                  </motion.div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="creepy-font"
                  style={{ fontSize: '2.5rem', marginBottom: '8px' }}
                >
                  Fate Sealed
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{ color: 'var(--text-muted)', marginBottom: '32px' }}
                >
                  Your tickets have been booked. There is no turning back.
                </motion.p>

                {/* Ticket Card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="ticket-card"
                >
                  <div style={{ padding: '28px 28px 20px' }}>
                    <h3 className="creepy-font" style={{ fontSize: '1.8rem', marginBottom: '12px' }}>{movie.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-around', color: 'var(--text-secondary)', fontSize: '0.9rem', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</div>
                        {dates.find(d => d.full === selectedDate)?.date} {dates.find(d => d.full === selectedDate)?.month}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Time</div>
                        {selectedTime}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Screen</div>
                        {theaters.find(t => t.id === selectedTheater)?.name}
                      </div>
                    </div>
                  </div>

                  <hr className="ticket-divider" />

                  <div style={{ padding: '20px 28px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Seats</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {selectedSeats.map(s => (
                            <span key={s} style={{ padding: '3px 10px', background: 'var(--blood-subtle)', border: '1px solid var(--border-hover)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--blood-bright)' }}>₹{bookingTotalPrice.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center' }}
                >
                  <button className="btn-blood" onClick={() => router.push('/tickets')} style={{ padding: '12px 28px' }}>
                    View My Bookings
                  </button>
                  <button className="btn-ghost" onClick={() => router.push('/movies')}>
                    Browse More
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--blood)', fontSize: '0.85rem' }}
                >
                  <AlertTriangle size={14} /> You can cancel this booking anytime under "My Bookings" for a full refund back to your wallet.
                </motion.div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
