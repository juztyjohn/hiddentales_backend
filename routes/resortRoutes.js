import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Resort from '../models/resortModel.js';
import { isAuth, isAdmin } from '../utils.js';

const resortRouter = express.Router();

resortRouter.get('/', async (req, res) => {
  const resorts = await Resort.find();
  res.send(resorts);
});

resortRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newResort = new Resort({
      name: 'sample name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      dist: 'sample'+ Date.now(),
      city: 'sample1'+ Date.now(),
      email: 'example@example.com'+ Date.now(),
      image: '/images/p1.jpg',
      price: 0,
      category: 'sample category',
      availability: 0,
      rating: 0,
      numReviews: 0,
      description: 'sample description',
    });
    try{
      const resort = await newResort.save();
      res.send({ message: 'Resort Created', resort });

    }
    catch(err){
      console.log(err);
    }
  })
);

resortRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const resortId = req.params.id;
    const resort = await Resort.findById(resortId);
    if (resort) {
      resort.name = req.body.name;
      resort.slug = req.body.slug;
      resort.email = req.body.email;
      resort.dist = req.body.dist;
      resort.city = req.body.city;
      resort.price = req.body.price;
      resort.image = req.body.image;
      resort.images = req.body.images;
      resort.category = req.body.category;
      resort.availability = req.body.availability;
      resort.description = req.body.description;
      await resort.save();
      res.send({ message: 'Resort Updated' });
    } else {
      res.status(404).send({ message: 'Resort Not Found' });
    }
  })
);

resortRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const resort = await Resort.findById(req.params.id);
    if (resort) {
      await resort.remove();
      res.send({ message: 'Resort Deleted' });
    } else {
      res.status(404).send({ message: 'Resort Not Found' });
    }
  })
);

resortRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const resortId = req.params.id;
    const resort = await Resort.findById(resortId);
    if (resort) {
      if (resort.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      resort.reviews.push(review);
      resort.numReviews = resort.reviews.length;
      resort.rating =
        resort.reviews.reduce((a, c) => c.rating + a, 0) /
        resort.reviews.length;
      const updatedResort = await resort.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedResort.reviews[updatedResort.reviews.length - 1],
        numReviews: resort.numReviews,
        rating: resort.rating,
      });
    } else {
      res.status(404).send({ message: 'Resort Not Found' });
    }
  })
);

const PAGE_SIZE = 3;

resortRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const resorts = await Resort.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countResorts = await Resort.countDocuments();
    res.send({
      resorts,
      countResorts,
      page,
      pages: Math.ceil(countResorts / pageSize),
    });
  })
);

resortRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const price = query.price || '';
    const rating = query.rating || '';
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
    const priceFilter =
      price && price !== 'all'
        ? {
            // 1-50
            price: {
              $gte: Number(price.split('-')[0]),
              $lte: Number(price.split('-')[1]),
            },
          }
        : {};
    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'lowest'
        ? { price: 1 }
        : order === 'highest'
        ? { price: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };

    const resorts = await Resort.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countResorts = await Resort.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    res.send({
      resorts,
      countResorts,
      page,
      pages: Math.ceil(countResorts / pageSize),
    });
  })
);

resortRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Resort.find().distinct('category');
    res.send(categories);
  })
);

resortRouter.get('/slug/:slug', async (req, res) => {
  const resort = await Resort.findOne({ slug: req.params.slug });
  if (resort) {
    res.send(resort);
  } else {
    res.status(404).send({ message: 'Resort Not Found' });
  }
});
resortRouter.get('/:id', async (req, res) => {
  const resort = await Resort.findById(req.params.id);
  if (resort) {
    res.send(resort);
  } else {
    res.status(404).send({ message: 'Resort Not Found' });
  }
});

export default resortRouter;
