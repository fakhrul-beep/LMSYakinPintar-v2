import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

/**
 * Creates a pending payment record for a booking.
 * 
 * @route POST /api/payments/create
 * @access Public (or Private depending on flow, currently assumes protected by upstream or token check if needed)
 */
router.post("/create", async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId) {
      return res.status(400).json({ message: "Missing bookingId" });
    }

    // 1. Get Booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, price_total")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. Create Payment Record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount: booking.price_total,
        status: "pending",
        provider: "midtrans"
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Create payment error", paymentError);
      return res.status(500).json({ message: "Error creating payment record" });
    }

    return res.status(201).json({
      message: "Payment created (Midtrans integration TODO)",
      paymentId: payment.id,
      payment: payment
    });
  } catch (err) {
    console.error("Create payment error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Handles payment webhooks (e.g., from Midtrans).
 * 
 * @route POST /api/payments/webhook
 * @access Public
 */
router.post("/webhook", async (req, res) => {
  try {
    // TODO: handle Midtrans webhook payload
    // Example: Update payment status based on webhook data
    console.log("Received payment webhook", req.body);
    
    // In a real implementation, we would:
    // 1. Verify signature
    // 2. Find payment by order_id
    // 3. Update payment status
    // 4. Update booking status if payment success

    return res.status(200).json({ message: "Webhook received" });
  } catch (err) {
    console.error("Webhook error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
