import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingItems: [
      {
        slug: { type: String, required: true },
        name: { type: String, required: true },
        availability: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        Resort: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Resort',
        },
      },
    ],
    bookingAddress: {
      fullName: { type: String},
      address: { type: String},
      city: { type: String},
      postalCode: { type: String},
      country: { type: String},
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
      bill:String,
    },
    bookingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isCheckedIn: { type: Boolean, default: false },
    checkedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
