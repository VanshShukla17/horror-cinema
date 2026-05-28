'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Skull, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function LoginContent() {
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/movies';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    const identifier = e.target.loginIdentifier.value;
    const password = e.target.loginPassword.value;

    const { data, error } = await signIn(identifier, password);

    if (error) {
      setMessage({ text: error.message || 'Invalid credentials.', type: 'error' });
    } else {
      setMessage({ text: 'Access granted. Entering the void...', type: 'success' });
      setTimeout(() => {
        window.location.href = redirect;
      }, 1000);
    }
    setIsLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    const username = e.target.signupUsername.value;
    const email = e.target.signupEmail.value;
    const password = e.target.signupPassword.value;
    const age = e.target.signupAge.value;

    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      setIsLoading(false);
      return;
    }

    if (!age || isNaN(age) || parseInt(age) <= 0) {
      setMessage({ text: 'Please enter a valid age.', type: 'error' });
      setIsLoading(false);
      return;
    }

    const { data, error } = await signUp(email, password, username, age);

    if (error) {
      setMessage({ text: error.message || 'Registration failed.', type: 'error' });
    } else {
      setMessage({ text: 'Account created! You can now sign in.', type: 'success' });
      setTimeout(() => setIsSignup(false), 2000);
    }
    setIsLoading(false);
  };

  const formVariants = {
    enter: { opacity: 0, x: isSignup ? 40 : -40 },
    center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: isSignup ? -40 : 40, transition: { duration: 0.25 } },
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background atmosphere */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(139,0,0,0.08), transparent 50%), radial-gradient(circle at 70% 80%, rgba(139,0,0,0.05), transparent 50%)',
      }} />

      {/* Floating horror elements */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, delay: i * 1.5 }}
          style={{ position: 'absolute', top: `${20 + i * 20}%`, left: `${15 + i * 20}%`, color: 'var(--blood)', zIndex: 0 }}
        >
          <Skull size={16 + i * 4} />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass"
        style={{ width: '100%', maxWidth: '420px', padding: '40px', position: 'relative', zIndex: 1 }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }}>
            <Skull size={36} color="var(--blood)" />
          </motion.div>
          <h1 className="creepy-font" style={{ fontSize: '2rem', marginTop: '12px', letterSpacing: '3px' }}>CineMacabre</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {isSignup ? 'Join the congregation' : 'Welcome back, mortal'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex', marginBottom: '28px',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px', gap: '4px',
        }}>
          <button
            onClick={() => { if (!isLoading) { setIsSignup(false); setMessage({ text: '', type: '' }); } }}
            style={{
              flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              fontWeight: 600, fontSize: '0.9rem', transition: 'var(--transition)',
              background: !isSignup ? 'var(--blood)' : 'transparent',
              color: !isSignup ? '#fff' : 'var(--text-muted)',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { if (!isLoading) { setIsSignup(true); setMessage({ text: '', type: '' }); } }}
            style={{
              flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              fontWeight: 600, fontSize: '0.9rem', transition: 'var(--transition)',
              background: isSignup ? 'var(--blood)' : 'transparent',
              color: isSignup ? '#fff' : 'var(--text-muted)',
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {!isSignup ? (
            <motion.form key="login" variants={formVariants} initial="enter" animate="center" exit="exit" onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Username or Email</label>
                <input id="loginIdentifier" type="text" className="input-dark" placeholder="your@email.com or username" required disabled={isLoading} />
              </div>
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                <input id="loginPassword" type={showPassword ? 'text' : 'password'} className="input-dark" placeholder="••••••••" required disabled={isLoading} style={{ paddingRight: '48px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', bottom: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" className="btn-blood" disabled={isLoading} style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                {isLoading ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>Authenticating...</motion.span> : 'Sign In'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form key="signup" variants={formVariants} initial="enter" animate="center" exit="exit" onSubmit={handleSignup}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Username</label>
                <input id="signupUsername" type="text" className="input-dark" placeholder="Choose a username" required disabled={isLoading} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</label>
                <input id="signupEmail" type="email" className="input-dark" placeholder="your@email.com" required disabled={isLoading} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Age</label>
                <input id="signupAge" type="number" className="input-dark" placeholder="Enter your age" required disabled={isLoading} min="1" max="120" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                <input id="signupPassword" type="password" className="input-dark" placeholder="Min 6 characters" required disabled={isLoading} />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" className="btn-blood" disabled={isLoading} style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                {isLoading ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>Creating account...</motion.span> : 'Create Account'}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Message */}
        <AnimatePresence>
          {message.text && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: '16px', textAlign: 'center', fontSize: '0.9rem',
                color: message.type === 'error' ? 'var(--blood-bright)' : '#4ade80',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              {message.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
              {message.text}
            </motion.p>
          )}
        </AnimatePresence>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ color: 'var(--blood)', fontFamily: "'Cinzel', serif" }}>Summoning...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
