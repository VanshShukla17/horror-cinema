import { supabase } from './supabase';

/**
 * Create a new booking in Supabase or server-side fallback JSON file
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

      if (!error && data) {
        return { data, error };
      }
    } catch (err) {
      console.warn('Supabase createBooking failed. Falling back to local server API.', err);
    }
  }

  // Local server API fallback
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, movieId, movieTitle, theaterName, showDate, showTime, seats, totalPrice })
    });
    const data = await res.json();
    if (res.ok) {
      return { data, error: null };
    }
    return { data: null, error: { message: data.error || 'Failed to create booking' } };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
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

      if (!error && data) {
        return { data, error };
      }
    } catch (err) {
      console.warn('Supabase getUserBookings failed. Falling back to local server API.', err);
    }
  }

  // Local server API fallback
  try {
    const res = await fetch(`/api/bookings?userId=${userId}`);
    const data = await res.json();
    if (res.ok) {
      return { data, error: null };
    }
    return { data: [], error: { message: data.error || 'Failed to get bookings' } };
  } catch (err) {
    return { data: [], error: { message: err.message } };
  }
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

      if (!error && data) {
        return { data, error };
      }
    } catch (err) {
      console.warn('Supabase getBookingById failed. Falling back to local server API.', err);
    }
  }

  // Local server API fallback
  try {
    const res = await fetch(`/api/bookings?bookingId=${bookingId}`);
    const data = await res.json();
    if (res.ok) {
      return { data, error: null };
    }
    return { data: null, error: { message: data.error || 'Failed to get booking' } };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

/**
 * Update remaining scans of a booking
 */
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
      if (!error && data) {
        return { data, error };
      }
    } catch (err) {
      console.warn('Supabase update failed, using local server API fallback.', err);
    }
  }

  // Local server API fallback
  try {
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookingId, remaining_scans: newCount })
    });
    const data = await res.json();
    if (res.ok) {
      return { data, error: null };
    }
    return { data: null, error: { message: data.error || 'Failed to update scans' } };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

/**
 * Cancel a booking
 */
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
      if (!error && data) {
        return { data, error };
      }
    } catch (err) {
      console.warn('Supabase cancel failed, using local server API fallback.', err);
    }
  }

  // Local server API fallback
  try {
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookingId, status: 'cancelled' })
    });
    const data = await res.json();
    if (res.ok) {
      return { data, error: null };
    }
    return { data: null, error: { message: data.error || 'Failed to cancel booking' } };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}
