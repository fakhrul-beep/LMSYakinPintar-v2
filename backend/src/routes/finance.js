import express from "express";
import supabase from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Get Tutor Balance & Stats
 * 
 * @route GET /api/finance/balance
 * @access Tutor
 */
router.get("/balance", requireAuth, requireRole("tutor"), async (req, res) => {
  try {
    // 1. Get Tutor ID
    const { data: tutor, error: tutorError } = await supabase
      .from("tutors")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (tutorError || !tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // 2. Calculate balance from transactions
    // In Supabase/SQL, we could do this with aggregation query, but for simplicity let's fetch & calc JS side
    // or use a view/RPC. Sticking to client side calculation to match previous logic logic for now.
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("tutor_id", tutor.id)
      .eq("status", "completed");

    if (txError) throw txError;

    const balance = transactions.reduce((acc, curr) => {
        if (curr.type === "income") return acc + curr.amount;
        if (curr.type === "withdrawal" || curr.type === "fee") return acc - curr.amount;
        return acc;
    }, 0);

    const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Get pending withdrawals
    // Note: 'withdrawals' table was not in my schema.sql earlier!
    // I should add it or use 'transactions' with status 'pending' & type 'withdrawal' if that was the design.
    // The previous Mongoose code imported Withdrawal model.
    // Let's assume we use 'transactions' table for withdrawals too, or I need to create 'withdrawals' table.
    // Looking at schema.sql, I defined 'transactions' but not 'withdrawals'.
    // Let's use 'transactions' table for withdrawals for simplicity and normalization, 
    // OR create a new table. 
    // Mongoose code had `Withdrawal` model.
    // Let's stick to `transactions` table for all money movements if possible, or creating `withdrawals` table if distinct.
    // Wait, the previous code had `Withdrawal.find`.
    // Let's check if I can map it to `transactions` table with type='withdrawal' and status='pending'.
    // Yes, `transactions` table has `type` and `status`.
    
    // BUT, `Withdrawal` model might have `paymentMethod` and `accountDetails`.
    // My `transactions` table has `description`. I can store JSON in description or add columns.
    // For MVP refactor, let's use `transactions` table for withdrawals.
    
    const { data: pendingWithdrawals, error: pendingError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("tutor_id", tutor.id)
        .eq("type", "withdrawal")
        .eq("status", "pending");

    if (pendingError) throw pendingError;
    
    const pendingAmount = pendingWithdrawals.reduce((acc, curr) => acc + curr.amount, 0);

    return res.json({
        balance,
        totalIncome,
        pendingAmount,
        currency: "IDR"
    });

  } catch (err) {
    console.error("Get balance error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Get Transaction History
 * 
 * @route GET /api/finance/transactions
 * @access Tutor
 */
router.get("/transactions", requireAuth, requireRole("tutor"), async (req, res) => {
    try {
        const { data: tutor, error: tutorError } = await supabase
            .from("tutors")
            .select("id")
            .eq("user_id", req.user.id)
            .single();

        if (tutorError || !tutor) return res.status(404).json({ message: "Tutor not found" });

        const { data: transactions, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("tutor_id", tutor.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        return res.json(transactions);
    } catch (err) {
        console.error("Get transactions error", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * Request Withdrawal
 * 
 * @route POST /api/finance/withdraw
 * @access Tutor
 */
router.post("/withdraw", requireAuth, requireRole("tutor"), async (req, res) => {
    try {
        const { amount, paymentMethod, accountDetails } = req.body;
        
        if (!amount || amount < 50000) { // Min withdraw 50k
            return res.status(400).json({ message: "Minimum withdrawal is IDR 50,000" });
        }

        const { data: tutor, error: tutorError } = await supabase
            .from("tutors")
            .select("id")
            .eq("user_id", req.user.id)
            .single();

        if (tutorError || !tutor) return res.status(404).json({ message: "Tutor not found" });

        // Check balance
        const { data: allTransactions, error: txError } = await supabase
            .from("transactions")
            .select("type, amount, status")
            .eq("tutor_id", tutor.id);

        if (txError) throw txError;

        // Calc current balance (completed txs)
        const currentBalance = allTransactions
            .filter(t => t.status === "completed")
            .reduce((acc, curr) => {
                if (curr.type === "income") return acc + curr.amount;
                if (curr.type === "withdrawal" || curr.type === "fee") return acc - curr.amount;
                return acc;
            }, 0);

        // Calc pending withdrawals (pending txs of type withdrawal)
        const pendingAmount = allTransactions
            .filter(t => t.type === "withdrawal" && t.status === "pending")
            .reduce((acc, curr) => acc + curr.amount, 0);

        if (currentBalance - pendingAmount < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Create Withdrawal Transaction
        // We'll use the 'transactions' table. We can store payment details in description for now.
        const description = JSON.stringify({ paymentMethod, accountDetails });

        const { data: withdrawal, error: createError } = await supabase
            .from("transactions")
            .insert({
                tutor_id: tutor.id,
                amount,
                type: "withdrawal",
                status: "pending",
                description: description
            })
            .select()
            .single();

        if (createError) {
             console.error("Withdraw request error", createError);
             return res.status(500).json({ message: "Error processing withdrawal" });
        }

        return res.status(201).json(withdrawal);

    } catch (err) {
        console.error("Withdraw request error", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * Get Withdrawal History
 * 
 * @route GET /api/finance/withdrawals
 * @access Tutor
 */
router.get("/withdrawals", requireAuth, requireRole("tutor"), async (req, res) => {
    try {
        const { data: tutor, error: tutorError } = await supabase
            .from("tutors")
            .select("id")
            .eq("user_id", req.user.id)
            .single();

        if (tutorError || !tutor) return res.status(404).json({ message: "Tutor not found" });

        const { data: withdrawals, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("tutor_id", tutor.id)
            .eq("type", "withdrawal")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json(withdrawals);
    } catch (err) {
        console.error("Get withdrawals error", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
