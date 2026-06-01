import mongoose, { Document, Schema } from 'mongoose';

export interface ICity extends Document {
  name: string;
  normalizedName: string;
  active: boolean;
  createdAt?: Date;
}

const normalizeCityName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const CitySchema: Schema = new Schema<ICity>(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

CitySchema.pre('validate', function cityNormalize(next) {
  const currentName = String(this.get('name') || '').trim();
  if (currentName) {
    this.set('name', currentName);
    this.set('normalizedName', normalizeCityName(currentName));
  }
  next();
});

CitySchema.index({ normalizedName: 1 }, { unique: true });

export const CityModel = mongoose.model<ICity>('City', CitySchema);
export { normalizeCityName };
