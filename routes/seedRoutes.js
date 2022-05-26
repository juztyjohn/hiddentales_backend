import express from 'express';
import Place from '../models/placeModel.js';
import data from '../data.js';
import User from '../models/userModel.js';

const seedRouter = express.Router();

seedRouter.get('/pro', async (req, res) => {
  await Place.remove({});
  const createdPlaces = await Place.insertMany(data.places);
  await User.remove({});
  const createdUsers = await User.insertMany(data.users);
  res.send({ createdPlaces, createdUsers });
});
export default seedRouter;
