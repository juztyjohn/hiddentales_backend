import mongoose from 'mongoose';

const resortregSchema = new mongoose.Schema(
  {
    rname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isResort: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
  }
);

const Resortreg = mongoose.model('Resortreg', resortregSchema);
export default Resortreg;
