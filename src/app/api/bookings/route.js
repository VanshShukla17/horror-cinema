import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/bookings_db.json');

// Helper to read bookings from JSON file
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading bookings DB:', err);
    return [];
  }
}

// Helper to write bookings to JSON file
function writeDb(bookings) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(bookings, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing bookings DB:', err);
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const bookingId = searchParams.get('bookingId');
  
  const bookings = readDb();
  
  if (bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json(booking);
  }
  
  if (userId) {
    const userBookings = bookings
      .filter(b => b.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return NextResponse.json(userBookings);
  }
  
  return NextResponse.json(bookings);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, movieId, movieTitle, theaterName, showDate, showTime, seats, totalPrice } = body;
    
    const bookings = readDb();
    
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
    writeDb(bookings);
    
    return NextResponse.json(newBooking);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, remaining_scans, status } = body;
    
    const bookings = readDb();
    const index = bookings.findIndex(b => b.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    if (remaining_scans !== undefined) {
      bookings[index].remaining_scans = remaining_scans;
    }
    
    if (status !== undefined) {
      bookings[index].status = status;
    }
    
    writeDb(bookings);
    return NextResponse.json(bookings[index]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
