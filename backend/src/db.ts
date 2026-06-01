import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from './models/User';
import { CityModel, normalizeCityName } from './models/City';

dotenv.config();

const DEFAULT_CITIES = [
  'São José dos Campos',
  'Jacareí',
  'Caçapava',
  'Jambeiro',
  'Monteiro Lobato',
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    console.log(`MongoDB Conectado: ${conn.connection.host}`);

    const adminUser = await UserModel.findOne({ username: 'admin' });
    if (!adminUser) {
      const newAdmin = new UserModel({
        username: 'admin',
        password: '123',
        role: 'admin',
      });
      await newAdmin.save();
      console.log('Usuario "admin" criado com sucesso.');
    }

    const cityOps = DEFAULT_CITIES.map((name) => {
      const normalized = normalizeCityName(name);
      return {
        updateOne: {
          filter: { normalizedName: normalized },
          update: {
            $setOnInsert: { name, normalizedName: normalized },
            $set: { active: true },
          },
          upsert: true,
        },
      };
    });
    await CityModel.bulkWrite(cityOps);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    } else {
      console.error(`Erro ao conectar ao MongoDB: ${error}`);
    }
    process.exit(1);
  }
};

export default connectDB;
