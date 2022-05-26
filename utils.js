import jwt from 'jsonwebtoken';
import mg from 'mailgun-js';

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isResort: user.isResort,

    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        res.status(401).send({ message: 'Invalid Token' });
      } else {
        req.user = decode;
        next();
      }
    });
  } else {
    res.status(401).send({ message: 'No Token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.isResort))  {
    next();
  } else {
    res.status(401).send({ message: 'Invalid Admin Token' });
  }
};
export const mailgun = () =>
  mg({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMIAN,
  });

export const payBookingEmailTemplate = (booking) => {
  return `<h1>Thanks for Choosing us</h1>
  <p>
  Hi ${booking.user.name},</p>
  <p>We have finished processing your Booking.</p>
  <h2>[Booking ${booking._id}] (${booking.createdAt.toString().substring(0, 10)})</h2>
  <table>
  <thead>
  <tr>
  <td><strong>Room</strong></td>
  <td><strong>Booked Room</strong></td>
  <td><strong align="right">Price</strong></td>
  </thead>
  <tbody>
  ${booking.bookingItems
    .map(
      (item) => `
    <tr>
    <td>${item.name}</td>
    <td align="center">${item.quantity}</td>
    <td align="right"> Rs.${item.price}</td>
    </tr>
  `
    )
    .join('\n')}
  </tbody>
  <tfoot>
  <tr>
  <td colspan="2"><strong>Total Price:</strong></td>
  <td align="right"><strong> Rs.${booking.totalPrice}</strong></td>
  </tr>
  <tr>
  <td colspan="2">Payment Method:</td>
  <td align="right">${booking.paymentMethod}</td>
  </tr>
  </table>

  <h2>Booking address</h2>
  <p>
  ${booking.bookingAddress.fullName},<br/>
  ${booking.bookingAddress.address},<br/>
  ${booking.bookingAddress.city},<br/>
  ${booking.bookingAddress.country},<br/>
  ${booking.bookingAddress.postalCode}<br/>
  </p>
  <hr/>
  <p>
  Thanks for Choosing us.
  </p>
  `;
};
