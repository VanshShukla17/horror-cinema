'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ChevronRight, Skull, Ghost, Eye } from 'lucide-react';
import { movies } from '@/data/movies';

const featured = movies.slice(0, 3);
const nowShowing = movies;

export default function HomePage() {
  return (
    <div className="page-wrapper">

      {/* ===== HERO BANNER ===== */}
      <section style={{ position: 'relative', height: '70vh', overflow: 'hidden' }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${featured[0].banner})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.3) contrast(1.3) saturate(0.8)',
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 50%), linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 60%)',
        }} />

        {/* Floating horror particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
              x: [0, (i % 2 === 0 ? 15 : -15), 0],
            }}
            transition={{ duration: 5 + i * 1.5, repeat: Infinity, delay: i * 0.8 }}
            style={{
              position: 'absolute',
              top: `${15 + i * 12}%`,
              left: `${10 + i * 14}%`,
              zIndex: 2,
              color: 'var(--blood)',
              filter: 'blur(1px)',
            }}
          >
            {i % 3 === 0 ? <Skull size={20} /> : i % 3 === 1 ? <Ghost size={18} /> : <Eye size={16} />}
          </motion.div>
        ))}

        {/* Hero Content */}
        <div className="container" style={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: '600px' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="genre-tag" style={{ marginBottom: '16px', display: 'inline-block', fontSize: '0.85rem' }}>
                🔥 NOW SHOWING
              </span>
              <h1 className="creepy-font" style={{ fontSize: '4rem', lineHeight: 1.05, marginBottom: '16px', color: '#fff' }}>
                {featured[0].title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span className="rating-badge"><Star size={13} fill="#4ade80" />{featured[0].rating}/5</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{featured[0].votes} votes</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>•</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{featured[0].duration}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '1rem', lineHeight: 1.7 }}>
                {featured[0].synopsis.substring(0, 150)}...
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ display: 'flex', gap: '12px' }}
            >
              <Link href={`/movies/${featured[0].id}`} className="btn-blood" style={{ padding: '14px 32px' }}>
                Book Tickets
              </Link>
              <Link href="/movies" className="btn-ghost">
                Browse All <ChevronRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== NOW SHOWING ===== */}
      <section className="container" style={{ padding: '48px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ fontSize: '1.8rem' }}
          >
            Now Showing
          </motion.h2>
          <Link href="/movies" className="btn-ghost" style={{ fontSize: '0.85rem' }}>
            See All <ChevronRight size={14} />
          </Link>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}
        >
          {nowShowing.map((movie) => (
            <motion.div
              key={movie.id}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
            >
              <Link href={`/movies/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="movie-card">
                  <div style={{ overflow: 'hidden', position: 'relative' }}>
                    <img src={movie.image} alt={movie.title} className="movie-card-img" />
                    {/* Rating overlay */}
                    <div style={{
                      position: 'absolute', bottom: '10px', left: '10px', right: '10px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    }}>
                      <span className="rating-badge" style={{ backdropFilter: 'blur(8px)' }}>
                        <Star size={11} fill="#4ade80" />{movie.rating}/5
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', backdropFilter: 'blur(8px)' }}>
                        {movie.votes} votes
                      </span>
                    </div>
                  </div>
                  <div className="movie-card-body">
                    <div className="movie-card-title">{movie.title}</div>
                    <div className="movie-card-meta">
                      {movie.genre.map(g => <span key={g} className="genre-tag">{g}</span>)}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(139,0,0,0.15), transparent)', zIndex: 0 }} />
        <motion.div
          className="container"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            style={{ marginBottom: '20px', display: 'inline-block' }}
          >
            <Skull size={48} color="var(--blood)" />
          </motion.div>
          <h2 className="creepy-font" style={{ fontSize: '3rem', marginBottom: '16px' }}>
            Dare to Watch Alone?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 32px', fontSize: '1.05rem' }}>
            The most terrifying screenings happen at midnight. Special late-night shows available every Friday.
          </p>
          <Link href="/movies" className="btn-blood" style={{ padding: '14px 40px', fontSize: '1rem' }}>
            Explore Midnight Shows
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
