import Stripe from "stripe";
import { STRIPE_CANCEL_URL,  STRIPE_SECRET_KEY, STRIPE_SUCCESS_URL } from "../config/config.js";


const stripe = new Stripe(STRIPE_SECRET_KEY);

export const createCheckoutSession = async ({stripe ,  doctorName, amount, appointmentId }) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "pkr",
          product_data: { name: `Appointment with Dr.${doctorName}` },
          unit_amount: amount * 100, // PKR in paisa
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url:`${STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:STRIPE_CANCEL_URL,
  });

  return { sessionId: session.id, checkoutUrl: session.url };
};

export default stripe