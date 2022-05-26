import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Place from '../models/placeModel.js';
import { isAuth, isAdmin } from '../utils.js';

const placeRouter = express.Router();

placeRouter.get('/', async (req, res) => {
  const places = await Place.find();
  res.send(places);
});

placeRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newPlace = new Place({
      name: 'sample name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      dist: 'select',
      city:'select',
      image: '/images/p1.jpg',
      category: 'sample category',
      rating: 0,
      numReviews: 0,
      description: 'sample description',
    });
    const place = await newPlace.save();
    res.send({ message: 'Place Created', place });
  })
);

placeRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const placeId = req.params.id;
    const place = await Place.findById(placeId);
    if (place) {
      place.name = req.body.name;
      place.slug = req.body.slug;
      place.dist = req.body.dist;
      place.city = req.body.city;
      place.image = req.body.image;
      place.images = req.body.images;
      place.category = req.body.category;
      place.location = req.body.location;
      place.description = req.body.description;
      await place.save();
      res.send({ message: 'Place Updated' });
    } else {
      res.status(404).send({ message: 'Place Not Found' });
    }
  })
);

placeRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const place = await Place.findById(req.params.id);
    if (place) {
      await place.remove();
      res.send({ message: 'Place Deleted' });
    } else {
      res.status(404).send({ message: 'Place Not Found' });
    }
  })
);

placeRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const placeId = req.params.id;
    const place = await Place.findById(placeId);
    if (place) {
      if (place.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      place.reviews.push(review);
      place.numReviews = place.reviews.length;
      place.rating =
        place.reviews.reduce((a, c) => c.rating + a, 0) /
        place.reviews.length;
      const updatedPlace = await place.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedPlace.reviews[updatedPlace.reviews.length - 1],
        numReviews: place.numReviews,
        rating: place.rating,
      });
    } else {
      res.status(404).send({ message: 'Place Not Found' });
    }
  })
);

const PAGE_SIZE = 3;

placeRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const places = await Place.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countPlaces = await Place.countDocuments();
    res.send({
      places,
      countPlaces,
      page,
      pages: Math.ceil(countPlaces / pageSize),
    });
  })
);

placeRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const dist = query.dist || '';
    const city = query.city || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
            name: {
              $regex: searchQuery,
              $options: 'i',
            },
          }
        : {};
    const categoryFilter = category && category !== 'all' ? { category } : {};
    const ratingFilter =
      rating && rating !== 'all'
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};
    const distFilter = dist && dist !== 'all' ? {dist} : {};
    const cityFilter = city && city !== 'all' ? {city} : {};
    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };

    const places = await Place.find({
      ...queryFilter,
      ...categoryFilter,
      ...distFilter,
      ...cityFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countPlaces = await Place.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...distFilter,
      ...cityFilter,
      ...ratingFilter,
    });
    res.send({
      places,
      countPlaces,
      page,
      pages: Math.ceil(countPlaces / pageSize),
    });
  })
);

placeRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Place.find().distinct('category');
    res.send(categories);
  })
);placeRouter.get(
  '/dists',
  expressAsyncHandler(async (req, res) => {
    const dists = await Place.find().distinct('dist');
    res.send(dists);
  })
);

placeRouter.get('/slug/:slug', async (req, res) => {
  const place = await Place.findOne({ slug: req.params.slug });
  if (place) {
    res.send(place);
  } else {
    res.status(404).send({ message: 'Place Not Found' });
  }
});
placeRouter.get('/:id', async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (place) {
    res.send(place);
  } else {
    res.status(404).send({ message: 'Place Not Found' });
  }
});

export default placeRouter;
