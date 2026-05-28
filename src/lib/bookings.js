import { supabase } from './supabase';

/**
 * Create a new booking in Supabase
 */
export async function createBooking({ userId, movieId, movieTitle, theaterName, showDate, showTime, seats, totalPrice }) {
  const isLocalUser = userId && userId.startsWith('local_');
  if (!isLocalUser) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          user_id: userId,
          movie_id: movieId,
          movie_title: movieTitle,
          theater_name: theaterName,
          show_date: showDate,
          show_time: showTime,
          seats: seats,
          total_price: totalPrice,
          status: 'confirmed',
        }])
        .select()
        .single();

      if (error) {
        if (error.message && (error.message.includes('fetch') || error.message.includes('Load failed') || error.message.includes('Network'))) {
          throw new Error('Network error');
        }
        return { data, error };
      }
      return { data, error };
    } catch (err) {
      console.warn('Supabase createBooking failed. Falling back to local storage.', err);
    }
  }

  // Local storage fallback
  const bookings = JSON.parse(localStorage.getItem('macabre_bookings') || '[]');
  const newBooking = {
    id: 'book_' + Math.random().toString(36).substr(2, 9),
    user_id: userId,
    movie_id: movieId,
    movie_title: movieTitle,
    theater_name: theaterName,
    show_date: showDate,
    show_time: showTime,
    seats: seats,
    total_price: totalPrice,
    status: 'confirmed',
    remaining_scans: seats.length,
    created_at: new Date().toISOString()
  };
  bookings.push(newBooking);
  localStorage.setItem('macabre_bookings', JSON.stringify(bookings));
  return { data: newBooking, error: null };
}

/**
 * Get all bookings for a user
 */
export async function getUserBookings(userId) {
  const isLocalUser = userId && userId.startsWith('local_');
  if (!isLocalUser) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message && (error.message.includes('fetch') || error.message.includes('Load failed') || error.message.includes('Network'))) {
          throw new Error('Network error');
        }
        return { data: data || [], error };
      }
      return { data: data || [], error };
    } catch (err) {
      console.warn('Supabase getUserBookings failed. Falling back to local storage.', err);
    }
  }

  // Local storage fallback
  const bookings = JSON.parse(localStorage.getItem('macabre_bookings') || '[]');
  const userBookings = bookings
    .filter(b => b.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { data: userBookings, error: null };
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(bookingId) {
  const isLocalBooking = bookingId && bookingId.startsWith('book_');
  if (!isLocalBooking) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) {
        if (error.message && (error.message.includes('fetch') || error.message.includes('Load failed') || error.message.includes('Network'))) {
          throw new Error('Network error');
        }
        return { data, error };
      }
      return { data, error };
    } catch (err) {
      console.warn('Supabase getBookingById failed. Falling back to local storage.', err);
    }
  }

  // Local storage fallback
  const bookings = JSON.parse(localStorage.getItem('macabre_bookings') || '[]');
  const booking = bookings.find(b => b.id === bookingId);
  return { data: booking || null, error: booking ? null : { message: 'Booking not found' } };
}

export async function updateBookingScans(bookingId, newCount) {
  const isLocalBooking = bookingId && bookingId.startsWith('book_');
  if (!isLocalBooking) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ remaining_scans: newCount })
        .eq('id', bookingId)
        .select()
        .single();
      return { data, error };
    } catch (err) {
      console.warn('Supabase update failed, using local fallback.', err);
    }
  }

  // Local storage fallback
  const bookings = JSON.parse(localStorage.getItem('macabre_bookings') || '[]');
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    bookings[index].remaining_scans = newCount;
    localStorage.setItem('macabre_bookings', JSON.stringify(bookings));
    return { data: bookings[index], error: null };
  }
  return { data: null, error: { message: 'Booking not found' } };
}

export async function cancelBooking(bookingId) {
  const isLocalBooking = bookingId && bookingId.startsWith('book_');
  if (!isLocalBooking) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();
      return { data, error };
    } catch (err) {
      console.warn('Supabase cancel failed, using local fallback.', err);
    }
  }

  // Local storage fallback
  const bookings = JSON.parse(localStorage.getItem('macabre_bookings') || '[]');
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    bookings[index].status = 'cancelled';
    localStorage.setItem('macabre_bookings', JSON.stringify(bookings));
    return { data: bookings[index], error: null };
  }
  return { data: null, error: { message: 'Booking not found' } };
}
