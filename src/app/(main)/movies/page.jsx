'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Search, Filter } from 'lucide-react';
import { movies } from '@/data/movies';

const allGenres = ['All', ...new Set(movies.flatMap(m => m.genre))];

export default function MoviesPage() {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const filtered = movies.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = selectedGenre === 'All' || m.genre.includes(selectedGenre);
    return matchSearch && matchGenre;
  });

  return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: '32px 24px 80px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '32px' }}
        >
          <h1 style={{ fontSize: '2.4rem', marginBottom: '8px' }}>Movies</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            {movies.length} horror experiences available for booking
          </p>
        </motion.div>

        {/* Search + Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}
        >
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-dark"
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {allGenres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={selectedGenre === genre ? 'showtime-btn showtime-btn-active' : 'showtime-btn'}
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                {genre}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Movie Grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}
        >
          {filtered.map((movie) => (
            <motion.div
              key={movie.id}
              variants={{ hidden: { opacity: 0, y: 30, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1 } }}
              layout
            >
              <Link href={`/movies/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="movie-card">
                  <div style={{ overflow: 'hidden', position: 'relative' }}>
                    <img src={movie.image} alt={movie.title} className="movie-card-img" />
                    <div style={{
                      position: 'absolute', bottom: '10px', left: '10px', right: '10px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    }}>
                      <span className="rating-badge" style={{ backdropFilter: 'blur(8px)' }}>
                        <Star size={11} fill="#4ade80" />{movie.rating}/5
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' }}>
                        {movie.votes} votes
                      </span>
                    </div>
                  </div>
                  <div className="movie-card-body">
                    <div className="movie-card-title">{movie.title}</div>
                    <div className="movie-card-meta">
                      {movie.genre.map(g => <span key={g} className="genre-tag">{g}</span>)}
                      <span className="genre-tag">{movie.language}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}
          >
            <p style={{ fontSize: '1.2rem' }}>No nightmares match your search.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
