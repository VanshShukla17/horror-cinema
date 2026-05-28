import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  movie: { type: String, required: true },
  date: { type: String, required: true },
  seats: { type: String, required: true },
  total_price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
