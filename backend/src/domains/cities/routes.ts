import { Router } from 'express';
import { CityModel, normalizeCityName } from '../../models/City';
import { authenticateToken, isAdmin } from '../../shared/auth';

export const citiesRouter = Router();

citiesRouter.get('/cities', authenticateToken, async (_req, res) => {
  try {
    const cities = await CityModel.find({ active: true }).sort({ name: 1 });
    return res.status(200).json(cities);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    return res.status(500).json({ message: 'Erro ao buscar cidades.' });
  }
});

citiesRouter.post('/cities', authenticateToken, isAdmin, async (req, res) => {
  try {
    const rawName = String(req.body?.name || '').trim();
    if (!rawName) {
      return res.status(400).json({ message: 'Nome da cidade é obrigatório.' });
    }

    const normalizedName = normalizeCityName(rawName);
    const duplicate = await CityModel.findOne({ normalizedName }).select('_id');
    if (duplicate) {
      return res.status(409).json({ message: 'Cidade já cadastrada.' });
    }

    const city = await CityModel.create({
      name: rawName,
      normalizedName,
      active: true,
    });

    return res.status(201).json(city);
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Cidade já cadastrada.' });
    }
    console.error('Erro ao criar cidade:', error);
    return res.status(500).json({ message: 'Erro ao criar cidade.' });
  }
});

citiesRouter.delete('/cities/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const city = await CityModel.findByIdAndUpdate(
      req.params.id,
      { $set: { active: false } },
      { new: true },
    );
    if (!city) {
      return res.status(404).json({ message: 'Cidade nao encontrada.' });
    }
    return res.status(200).json({ message: 'Cidade removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover cidade:', error);
    return res.status(500).json({ message: 'Erro ao remover cidade.' });
  }
});
