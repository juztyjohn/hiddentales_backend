import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import Resort from '../models/resortModel.js';
import { isAuth, isAdmin, mailgun, payBookingEmailTemplate } from '../utils.js';
import * as nodemailer from 'nodemailer';
import {google} from 'googleapis';

const bookingRouter = express.Router();

bookingRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const bookings = await Booking.find().populate('user', 'name');
    res.send(bookings);
  })
);

bookingRouter.post(
  '/',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    console.log(req.body);
    var bookingItems=req.body.bookingItems.map((x)=>({...x,resort:x._id}));
    const newBooking = new Booking({
      bookingItems: req.body.bookingItems.map((x) => ({ ...x, resort: x._id })),
      bookingAddress: req.body.bookingAddress,
      paymentMethod: req.body.paymentMethod,
      bookingPrice: req.body.bookingPrice,
      taxPrice: req.body.taxPrice,
      totalPrice: req.body.totalPrice,
      user: req.user._id,
    });
     bookingItems.map((val)=>{
       Resort.updateOne({_id:val._id},{availability:val.availability-val.quantity},function(err)
       {if(err){
         console.log(err);
       }
       })
     })

    const booking = await newBooking.save();
    res.status(201).send({ message: 'New Booking Done', booking });
  })
);

bookingRouter.get(
  '/summary',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const bookings = await Booking.aggregate([
      {
        $group: {
          _id: null,
          numBookings: { $sum: 1 },
          totalSales: { $sum: '$totalPrice' },
        },
      },
    ]);
    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: { $sum: 1 },
        },
      },
    ]);
    const dailyBookings = await Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          book: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const resortCategories = await Resort.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);
    res.send({ users, bookings, dailyBookings, resortCategories });
  })
);

bookingRouter.get(
  '/mine',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id });
    res.send(bookings);
  })
);

bookingRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      res.send(booking);
    } else {
      res.status(404).send({ message: 'Booking Not Found' });
    }
  })
);

bookingRouter.put(
  '/:id/checkin',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      booking.isCheckedIn = true;
      booking.checkedAt = Date.now();
      await booking.save();
      res.send({ message: 'Booking id Done' });
    } else {
      res.status(404).send({ message: 'Booking is Not Done' });
    }
  })
);

bookingRouter.put(
  '/:id/pay',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    console.log(req.data);
    const booking = await Booking.findById(req.params.id).populate(
      'user',
      'email name'
    );
    console.log(booking);
    if (booking) {
      booking.isPaid = true;
      booking.paidAt = Date.now();
      booking.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email,
      };
      const updatedBooking = await booking.save()
  try{
  
    const CLIENT_ID = '1039213398399-mhv0thr1cg7rblet0l8uk27vi2tf8ruc.apps.googleusercontent.com';
    const CLEINT_SECRET = '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';
    const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
    const REFRESH_TOKEN = '1//04LAxd6YdLMalCgYIARAAGAQSNwF-L9IrrlF13Btw4_OFCIJojnOGQw0YirEc9s5ehXKskxnSMa_atv6f-VjzstKDza6uTB5u_hc';
    
    const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLEINT_SECRET,
    REDIRECT_URI
    );
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    
    async function sendMail() {
    try {
    const accessToken = await oAuth2Client.getAccessToken();
    
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'justinjohnkavumkal@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });
    
    const mailOptions = {
      from: 'Admin HiddenTales <justinjohnkavumkal@gmail.com>',
      to: String(req.body.email),
      subject: `Booking Details ${booking._id}`,
      text: 'Booking details',
      html: payBookingEmailTemplate(booking),
    };
    
    const result = await transport.sendMail(mailOptions);
    return result;
    } catch (error) {
    return error;
    }
    }
    sendMail()
      .then((result) => console.log('Email sent...', result))
      .catch((error) => console.log(error.message));
  }
  catch(error){
    console.log(error)
  }


      res.send({ message: 'Booking is Paid', booking: updatedBooking });
    } else {
      res.status(404).send({ message: 'Booking is Not Done' });
    }
  })
);

bookingRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      await booking.remove();
      res.send({ message: 'Booking Cancelled' });
    } else {
      res.status(404).send({ message: 'Booking is Not Done' });
    }
  })
);

export default bookingRouter;
