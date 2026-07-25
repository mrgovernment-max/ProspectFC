import express from "express";
import cors from "cors";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import Stripe from "stripe";
import { Resend } from "resend";

import dotenv from "dotenv";
import { findPlayerStatsBySeason } from "./playerStats.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET);
const Estripe = new Stripe(process.env.ESTRIPE_SECRET);
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow all origins (for testing)
app.use(cors());

// Remove the problem line
// app.options("*", cors());  // DELETE THIS LINE

// Use this instead:
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ---------- ROUTES ---------- //

// Stripe checkout for Prospect FC kits
app.post("/Fcprospect", (req, res) => {
  const { order } = req.body;
  const location = (order[0].loc || "").trim().toLowerCase();
  const originalPrice = 25;
  const discountPercent = order[0].discountVal;
  const discount = originalPrice * (discountPercent / 100);
  const newPrice = originalPrice - discount;
  const price =
    location === "free collection in reading" ? newPrice : newPrice + 5;

  const line_items = order
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: `${item.kit} - ${item.size} - ${item.customize} - ${item.mail} - ${item.postcode} - ${item.contact} - ${item.houseNumber} - ${item.street} - ${item.locality} - ${item.town} - ${item.county}`,
          images: item.img ? [item.img] : [],
        },
        unit_amount: Math.round(price * 100),
      },
      quantity: item.quantity,
    }));

  if (line_items.length === 0) {
    return res.status(400).json({ error: "No valid items in cart." });
  }

  stripe.checkout.sessions.create(
    {
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: "https://mrgovernment-max.github.io/ProspectFC/success.html",
      cancel_url: "https://mrgovernment-max.github.io/ProspectFC/failed.html",
    },
    (error, session) => {
      if (error) {
        console.error("Stripe error /Fcprospect:", error.message);
        return res.status(500).json({ error: "Stripe session failed" });
      }
      res.json({ id: session.id });
    }
  );
});

// My web dues Payments
app.post("/payment", (req, res) => {
  const { payments } = req.body;
  const line_items = payments
    .filter((item) => typeof item.amount === "number" && item.amount > 0)
    .map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: `${item.name} - ${item.email} - ${item.service}`,
        },
        unit_amount: Math.round(item.amount * 100),
      },
      quantity: 1,
    }));

  Estripe.checkout.sessions.create(
    {
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url:
        "https://mrgovernment-max.github.io/pay-me-stripe/success.html",
      cancel_url:
        "https://mrgovernment-max.github.io/pay-me-stripe/cancel.html",
    },
    (error, session) => {
      if (error) {
        console.error("Stripe error /payment:", error.message);
        return res.status(500).json({ error: "Stripe session failed" });
      }
      res.json({ id: session.id });
    }
  );
});

//Contact for my personal portfolio

app.post("/contactme", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 1️⃣ Save to DB
    pool.query(
      "INSERT INTO portfolio_contact (name, email, subject, message) VALUES (?, ?, ?, ?)",
      [name, email, subject, message],
      async (err) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ message: "Server problem, resend message" });
        }

        try {
          await resend.emails.send({
            from: "Portfolio Contact <onboarding@resend.dev>",
            to: ["efenteng1@gmail.com"],
            subject: subject,
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Portfolio Message</title>
                <style>
                    /* Reset and base styles */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    }
                    
                    body {
                        background-color: #f8fafc;
                        padding: 24px;
                        line-height: 1.6;
                        color: #1e293b;
                    }
                    
                    .email-wrapper {
                        max-width: 640px;
                        margin: 0 auto;
                    }
                    
                    .email-container {
                        background: linear-gradient(to bottom right, #ffffff, #fefefe);
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.05);
                        border: 1px solid #e2e8f0;
                    }
                    
                    /* Header with accent color */
                    .email-header {
                        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                        color: white;
                        padding: 36px 32px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .header-decoration {
                        position: absolute;
                        top: -100px;
                        right: -100px;
                        width: 300px;
                        height: 300px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 50%;
                    }
                    
                    .header-decoration:nth-child(2) {
                        top: auto;
                        bottom: -80px;
                        left: -80px;
                        width: 200px;
                        height: 200px;
                    }
                    
                    .portfolio-icon {
                        font-size: 42px;
                        margin-bottom: 16px;
                        display: block;
                        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                    }
                    
                    .email-header h1 {
                        font-size: 28px;
                        font-weight: 700;
                        margin-bottom: 10px;
                        letter-spacing: -0.3px;
                        position: relative;
                        z-index: 1;
                    }
                    
                    .email-header p {
                        opacity: 0.9;
                        font-size: 16px;
                        font-weight: 400;
                        position: relative;
                        z-index: 1;
                    }
                    
                    /* Content Area */
                    .email-content {
                        padding: 40px 32px;
                    }
                    
                    .sender-info {
                        background-color: #f0f9ff;
                        border-radius: 12px;
                        padding: 24px;
                        margin-bottom: 32px;
                        border: 1px solid #e0f2fe;
                    }
                    
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                    }
                    
                    .info-item {
                        margin-bottom: 16px;
                    }
                    
                    .info-label {
                        display: block;
                        font-size: 14px;
                        color: #64748b;
                        margin-bottom: 6px;
                        font-weight: 500;
                        letter-spacing: 0.3px;
                    }
                    
                    .info-value {
                        display: block;
                        font-size: 16px;
                        color: #0f172a;
                        font-weight: 600;
                    }
                    
                    .info-value.email {
                        color: #3b82f6;
                    }
                    
                    .info-value.email a {
                        color: #3b82f6;
                        text-decoration: none;
                        font-weight: 600;
                    }
                    
                    .info-value.email a:hover {
                        text-decoration: underline;
                    }
                    
                    /* Message Section */
                    .message-container {
                        background-color: #ffffff;
                        border-radius: 12px;
                        padding: 8px 0 0;
                        border: 1px solid #f1f5f9;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
                    }
                    
                    .message-header {
                        padding: 0 24px 16px;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    
                    .message-header h2 {
                        font-size: 20px;
                        color: #334155;
                        font-weight: 600;
                    }
                    
                    .message-body {
                        padding: 24px;
                        font-size: 16px;
                        line-height: 1.7;
                        color: #475569;
                        white-space: pre-line;
                        background-color: #f8fafc;
                        border-radius: 0 0 12px 12px;
                        min-height: 120px;
                    }
                    
                    /* Footer */
                    .email-footer {
                        background-color: #f8fafc;
                        padding: 28px 32px;
                        border-top: 1px solid #e2e8f0;
                        color: #64748b;
                        font-size: 14px;
                        text-align: center;
                    }
                    
                    .portfolio-name {
                        font-weight: 700;
                        color: #3b82f6;
                        font-size: 16px;
                    }
                    
                    .footer-note {
                        margin-top: 16px;
                        font-size: 13px;
                        color: #94a3b8;
                        line-height: 1.5;
                    }
                    
                    .action-button {
                        display: inline-block;
                        margin-top: 20px;
                        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 15px;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
                    }
                    
                    .action-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
                    }
                    
                    /* Responsive */
                    @media (max-width: 640px) {
                        body {
                            padding: 12px;
                        }
                        
                        .email-header, .email-content, .email-footer {
                            padding-left: 24px;
                            padding-right: 24px;
                        }
                        
                        .email-header {
                            padding-top: 28px;
                            padding-bottom: 28px;
                        }
                        
                        .info-grid {
                            grid-template-columns: 1fr;
                        }
                        
                        .portfolio-icon {
                            font-size: 36px;
                        }
                        
                        .email-header h1 {
                            font-size: 24px;
                        }
                    }
                    
                    /* Dark mode support */
                    @media (prefers-color-scheme: dark) {
                        body {
                            background-color: #0f172a;
                        }
                        
                        .email-container {
                            background: linear-gradient(to bottom right, #1e293b, #0f172a);
                            border-color: #334155;
                        }
                        
                        .sender-info {
                            background-color: #1e293b;
                            border-color: #334155;
                        }
                        
                        .info-label {
                            color: #cbd5e1;
                        }
                        
                        .info-value {
                            color: #f1f5f9;
                        }
                        
                        .message-container {
                            background-color: #1e293b;
                            border-color: #334155;
                        }
                        
                        .message-header {
                            border-color: #334155;
                        }
                        
                        .message-header h2 {
                            color: #e2e8f0;
                        }
                        
                        .message-body {
                            background-color: #0f172a;
                            color: #cbd5e1;
                        }
                        
                        .email-footer {
                            background-color: #0f172a;
                            border-color: #334155;
                            color: #cbd5e1;
                        }
                        
                        .footer-note {
                            color: #94a3b8;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="email-container">
                        <div class="email-header">
                            <div class="header-decoration"></div>
                            <div class="header-decoration"></div>
                            <div class="portfolio-icon">📬</div>
                            <h1> Yo, New Portfolio Message Detected</h1>
                            <p>You told me to notify you. Here it is.</p>
                        </div>
                        
                        <div class="email-content">
                            <div class="sender-info">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">From</span>
                                        <span class="info-value">${name}</span>
                                    </div>
                                    
                                    <div class="info-item">
                                        <span class="info-label">Email</span>
                                        <span class="info-value email">
                                            <a href="mailto:${email}">${email}</a>
                                        </span>
                                    </div>
                                    
                                    <div class="info-item">
                                        <span class="info-label">Subject</span>
                                        <span class="info-value">${subject}</span>
                                    </div>
                                    
                                    <div class="info-item">
                                        <span class="info-label">Received</span>
                                        <span class="info-value">${new Date().toLocaleDateString(
                                          "en-US",
                                          {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }
                                        )}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="message-container">
                                <div class="message-header">
                                    <h2>Message</h2>
                                </div>
                                <div class="message-body">
                                    ${message}
                                </div>
                            </div>
                        </div>
                        
                        <div class="email-footer">
                            <p>This message was sent via your <span class="portfolio-name">portfolio website</span> contact form.</p>
                            
                            <a href="mailto:${email}" class="action-button">
                                Reply to ${name}
                            </a>
                            
                            <div class="footer-note">
                                <p>This is an automated message. Please reply directly to the sender's email address above.</p>
                                <p style="margin-top: 8px;">Message ID: ${Date.now()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `,
          });
        } catch (emailErr) {
          console.error("Email failed:", emailErr);
        }

        //  Respond to frontend
        res.status(201).json({ success: true, message: "Message received!" });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Contact form messages for Prospect
app.post("/messages", (req, res) => {
  const { name, mail, subject, mailbody } = req.body;
  const sql =
    "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)";
  pool.query(sql, [name, mail, subject, mailbody], (err) => {
    if (err) return res.status(500).send("Error.. Try Sending Message Again");
    res.send("Message sent");
  });
});

// Discounts
app.post("/discount_codes", (req, res) => {
  const { disCode } = req.body;
  const sql = `
    SELECT * FROM discount_codes
    WHERE code = ?
      AND uses_left > 0
      AND (expires_at IS NULL OR expires_at >= CURDATE())
  `;

  pool.query(sql, [disCode], (err, result) => {
    if (err) return res.status(500).send("DB query error");
    if (result.length === 0)
      return res.status(400).json({ message: "Code invalid or used up" });

    const discountPercent = result[0].discount_percent;
    pool.query(
      "UPDATE discount_codes SET uses_left = uses_left - 1 WHERE code = ?",
      [disCode]
    );
    res.json({ message: "Code applied", discountPercent });
  });
});

// Newsletter
app.post("/newsletter_subscribers", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  pool.query(
    "SELECT * FROM newsletter_subscribers WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("DB select error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error, try again later.",
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          success: false,
          message: "This email is already subscribed.",
        });
      }

      pool.query(
        "INSERT INTO newsletter_subscribers (email) VALUES (?)",
        [email],
        async (insertErr) => {
          if (insertErr) {
            console.error("DB insert error:", insertErr);
            return res.status(500).json({
              success: false,
              message: "Could not subscribe. Try again.",
            });
          }

          try {
            const html = `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Prospect FC Newsletter</title>
                <style>
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
            
                  body {
                    margin: 0;
                    padding: 0;
                    background: #f4f6f8;
                    font-family: Segoe UI, Roboto, Arial, sans-serif;
                    line-height: 1.6;
                  }
            
                  .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    border: 2px solid #1e3a8a;
                  }
            
                  .header {
                    text-align: center;
                    background: #1e3a8a;
                    color: white;
                    padding: 20px;
                  }
            
                  .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                  }
            
                  .logo {
                    max-width: 70px;
                    height: auto;
                  }
            
                  .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                  }
            
                  .hero-image {
                    width: 100%;
                    display: block;
                    max-height: 300px;
                    object-fit: cover;
                  }
            
                  .content-section {
                    padding: 30px;
                  }
            
                  h2 {
                    margin: 0 0 15px 0;
                    font-size: 26px;
                    color: #1e3a8a;
                  }
            
                  p {
                    margin: 0 0 15px 0;
                    color: #374151;
                    font-size: 18px;
                  }
            
                  ul {
                    color: #374151;
                    padding-left: 20px;
                    font-size: 16px;
                    margin-bottom: 25px;
                  }
            
                  li {
                    margin-bottom: 8px;
                  }
            
                  .button-container {
                    text-align: center;
                    margin: 25px 0;
                  }
            
                  .btn {
                    display: inline-block;
                    padding: 14px 30px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 5px;
                  }
            
                  .btn-primary {
                    background: #1e3a8a;
                    color: white;
                  }
            
                  .btn-secondary {
                    background: #0f172a;
                    color: white;
                  }
            
                  .merchandise-section {
                    background: #f8fafc;
                    padding: 30px;
                    border-top: 2px dashed #cbd5e1;
                    border-bottom: 2px dashed #cbd5e1;
                  }
            
                  .merchandise-section h2 {
                    text-align: center;
                    margin-bottom: 20px;
                  }
            
                  .merchandise-section p {
                    text-align: center;
                    margin-bottom: 20px;
                  }
            
                  .merchandise-container {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                    margin: 20px 0;
                  }
            
                  .merch-item {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                  }
            
                  .merch-image {
                    width: 90%;
                    border-radius: 8px;
                    margin-bottom: 15px;
                  }
            
                  .merch-item h3 {
                    margin: 0 0 5px 0;
                    font-size: 20px;
                    color: #0f172a;
                  }
            
                  .merch-price {
                    margin: 0 0 10px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1e3a8a;
                  }
            
                  .merch-details-btn {
                    display: inline-block;
                    background: #1e3a8a;
                    color: white;
                    padding: 8px 15px;
                    border-radius: 4px;
                    text-decoration: none;
                    font-size: 14px;
                  }
            
                  .shop-all-btn {
                    display: inline-block;
                    background: #0f172a;
                    color: white;
                    padding: 12px 25px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 16px;
                    text-align: center;
                    margin-top: 10px;
                  }
            
                  .footer {
                    text-align: center;
                    background: #0f172a;
                    color: #cbd5e1;
                    padding: 20px;
                    font-size: 16px;
                  }
            
                  .footer p {
                    margin: 0 0 5px 0;
                    color: #cbd5e1;
                  }
            
                  .social-links {
                    margin: 10px 0;
                  }
            
                  .social-links a {
                    color: #60a5fa;
                    text-decoration: underline;
                    margin: 0 10px;
                    font-size: 16px;
                  }
            
                  .footer-links {
                    margin: 10px 0 0 0;
                    font-size: 14px;
                  }
            
                  .footer-links a {
                    color: #94a3b8;
                    text-decoration: underline;
                  }
            
                  @media only screen and (max-width: 600px) {
                    .container {
                      width: 100%;
                      margin: 0;
                      border-radius: 0;
                    }
            
                    .header-content {
                      flex-direction: column;
                      gap: 10px;
                    }
            
                    .btn {
                      display: block;
                      width: 100%;
                      margin: 5px 0;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <!-- Header -->
                  <div class="header">
                    <div class="header-content">
                      <img
                        src="https://res.cloudinary.com/dazhskqcc/image/upload/v1754336732/image0_1_sdm2cz.png"
                        alt="Prospect FC Logo"
                        class="logo"
                      />
                      <h1>Prospect FC Newsletter</h1>
                    </div>
                  </div>
            
                  <!-- Hero Image -->
                  <img
                    src="https://res.cloudinary.com/dazhskqcc/image/upload/v1758931677/4ff3452a-da31-4241-a481-b3fe70af98b8_tfrnlt.jpg"
                    alt="Football Action"
                    class="hero-image"
                  />
            
                  <!-- Welcome Message -->
                  <div class="content-section">
                    <h2>Welcome to the Prospect FC Family! 👊</h2>
                    <p>
                      Thank you for subscribing to the official Prospect FC newsletter! As a
                      valued member of our community, you'll receive exclusive updates
                      including:
                    </p>
                    <ul>
                      <li>Match highlights and player performances</li>
                      <li>Behind-the-scenes training insights</li>
                      <li>Exclusive interviews with players and staff</li>
                      <li>Early access to ticket sales and special events</li>
                    </ul>
                    <div class="button-container">
                      <a href="prospectfc.com" class="btn btn-primary">Visit Our Website</a>
                      <a href="prospectfc.com/fixture" class="btn btn-secondary"
                        >View Fixtures</a
                      >
                    </div>
                  </div>
            
                  <!-- Merchandise Section -->
                  <div class="merchandise-section">
                    <h2>⚽ Show Your Colors! </h2>
                    <p>Represent Prospect FC with our official merchandise.</p>
            
                    <div class="merchandise-container">
                      <div class="merch-item">
                        <img
                          src="https://res.cloudinary.com/dazhskqcc/image/upload/v1754061296/mobile_hero_dufkug.jpg"
                          alt="Away Jersey"
                          class="merch-image"
                        />
                       
                      </div>
            
                      <div class="merch-item">
                        <img
                          src="https://res.cloudinary.com/dazhskqcc/image/upload/v1759003972/homekit_juceim.jpg"
                          alt="Home Jersey"
                          class="merch-image"
                        />
                      
                      </div>
                    </div>
            
                    <div style="text-align: center">
                      <a href="prospectfc.com/kit" class="shop-all-btn"
                        >Shop All Merchandise</a
                      >
                    </div>
                  </div>
            
                  <!-- Footer -->
                  <div class="footer">
                    <p>
                      <strong>Prospect FC</strong><br />
                      Reading
                    </p>
                    <div class="social-links">
                      <a href="https://prospectfc.com">Website</a>
                      <a href="https://www.facebook.com/share/16ngpSmCGs/?mibextid=wwXIfr"
                        >Facebook</a
                      >
                      <a
                        href="https://www.tiktok.com/@prospect.fc?is_from_webapp=1&sender_device=pc"
                        >TikTok</a
                      >
                      <a
                        href="https://www.instagram.com/prospect.fc?utm_source=ig_web_button_share_sheet&igsh=MXFkZzdrY2h3Mm5qcQ=="
                        >Instagram</a
                      >
                    </div>
                    <p class="footer-links">
                      <a href="https://prospectfc.com/unsubscribe">Unsubscribe</a>
                    </p>
                  </div>
                </div>
              </body>
            </html>
            `;

            await resend.emails.send({
              from: "Prospect FC <onboarding@resend.dev>",
              to: [email],
              subject: "Welcome to Prospect FC!",
              html: html,
            });

            return res
              .status(201)
              .json({ success: true, message: "Subscribed to Prospect FC!" });
          } catch (mailErr) {
            console.error("Email send error:", mailErr);
            return res.status(201).json({
              success: true,
              message: "Subscribed to Prospect FC!",
              emailSent: false,
            });
          }
        }
      );
    }
  );
});

//Unsubscribe Newsletter

app.delete("/newsletter_unsubscribe", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  pool.query(
    "DELETE FROM newsletter_subscribers WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("DB delete error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error." });
      }

      if (results.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Email not found." });
      }

      return res
        .status(200)
        .json({ success: true, message: "Unsubscribed successfully." });
    }
  );
});

// GET player stats by name and season
app.get("/player-stats", async (req, res) => {
  try {
    const { name, season } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Player name is required" });
    }

    if (!season) {
      return res.status(400).json({ message: "Season is required" });
    }

    const result = await findPlayerStatsBySeason({ name, season });

    if (!result) {
      return res.status(404).json({ message: "Player stats not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/player-stats", async (req, res) => {
  try {
    const { name, season } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Player name is required" });
    }

    if (!season) {
      return res.status(400).json({ message: "Season is required" });
    }

    const result = await findPlayerStatsBySeason({ name, season });

    if (!result) {
      return res.status(404).json({ message: "Player stats not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET route to fetch players
app.get("/players", (req, res) => {
  pool.query(
    "SELECT * FROM `players_26_27` ORDER BY p_number ASC",
    (err, results) => {
      if (err) {
        console.error("Error fetching players:", err);
        res.status(500).send("DB error");
      } else {
        res.json(results);
      }
    }
  );
});

// GET route to fetch players by name
app.get("/playersname", (req, res) => {
  pool.query("SELECT * FROM `players` ORDER BY name ASC", (err, results) => {
    if (err) {
      console.error("Error fetching players:", err);
      res.status(500).send("DB error");
    } else {
      res.json(results);
    }
  });
});

// GET route to fetch players by position
app.get("/playerspos", (req, res) => {
  pool.query(
    "SELECT * FROM `players_26_27` ORDER BY position DESC",
    (err, results) => {
      if (err) {
        console.error("Error fetching players:", err);
        res.status(500).send("DB error");
      } else {
        res.json(results);
      }
    }
  );
});

// GET route to fetch players by age
app.get("/playersage", (req, res) => {
  pool.query("SELECT * FROM `players_26_27` ORDER BY age ASC", (err, results) => {
    if (err) {
      console.error("Error fetching players:", err);
      res.status(500).send("DB error");
    } else {
      res.json(results);
    }
  });
});

// Products for e-commerce site
app.get("/products", (req, res) => {
  pool.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).send("Error fetching products");
    res.json(results);
  });
});

// Team stats 2024/25
app.get("/teamstats", (req, res) => {
  pool.query("SELECT * FROM team_stats", (err, results) => {
    if (err) return res.status(500).send("DB error");
    res.json(results);
  });
});

app.get("/filterbyname", (req, res) => {
  pool.query(
    "SELECT * FROM team_stats ORDER BY player_name ASC",
    (err, results) => {
      if (err) return res.status(500).send("DB error");
      res.json(results);
    }
  );
});

app.get("/filterbygames", (req, res) => {
  pool.query(
    "SELECT * FROM team_stats ORDER BY games_played DESC",
    (err, results) => {
      if (err) return res.status(500).send("DB error");
      res.json(results);
    }
  );
});

app.get("/filterbygoals", (req, res) => {
  pool.query("SELECT * FROM team_stats ORDER BY goals DESC", (err, results) => {
    if (err) return res.status(500).send("DB error");
    res.json(results);
  });
});

app.get("/filterbyassists", (req, res) => {
  pool.query(
    "SELECT * FROM team_stats ORDER BY assists DESC",
    (err, results) => {
      if (err) return res.status(500).send("DB error");
      res.json(results);
    }
  );
});

//TEAMSTATS 2025/26

// Team stats
app.get("/teamstatss", (req, res) => {
  pool.query("SELECT * FROM players", (err, results) => {
    if (err) return res.status(500).send("DB error");
    res.json(results);
  });
});

app.get("/filterbynamee", (req, res) => {
  pool.query("SELECT * FROM players ORDER BY name ASC", (err, results) => {
    if (err) return res.status(500).send("DB error");
    res.json(results);
  });
});

app.get("/filterbygamess", (req, res) => {
  pool.query(
    "SELECT * FROM players ORDER BY appearances DESC",
    (err, results) => {
      if (err) return res.status(500).send("DB error");
      res.json(results);
    }
  );
});

app.get("/filterbygoalss", (req, res) => {
  pool.query("SELECT * FROM players ORDER BY goals DESC", (err, results) => {
    if (err) return res.status(500).send("DB error");
    res.json(results);
  });
});

app.get("/filterbyassistss", (req, res) => {
  pool.query("SELECT * FROM players ORDER BY assists DESC", (err, results) => {
    if (err) return res.status(500).send("DB error");
    res.json(results);
  });
});

//TEAMSTATS ALL TIME

// Team stats
app.get("/teamstatssalltime", (req, res) => {
  pool.query("SELECT * FROM all_time_stats", (err, results) => {
    if (err) return res.status(500).send("DB error");
    res.json(results);
  });
});

app.get("/filterbynameealltime", (req, res) => {
  pool.query(
    "SELECT * FROM all_time_stats ORDER BY player_name ASC",
    (err, results) => {
      if (err) return res.status(500).send("DB error");
      res.json(results);
    }
  );
});

app.get("/filterbygamessalltime", (req, res) => {
  pool.query(
    "SELECT * FROM all_time_stats ORDER BY total_matches DESC",
    (err, results) => {
      if (err) return res.status(500).send("DB error");
      res.json(results);
    }
  );
});

app.get("/filterbygoalssalltime", (req, res) => {
  pool.query(
    "SELECT * FROM all_time_stats ORDER BY total_goals DESC",
    (err, results) => {
      if (err) return res.status(500).send("DB error");
      res.json(results);
    }
  );
});

app.get("/filterbyassistssalltime", (req, res) => {
  pool.query(
    "SELECT * FROM all_time_stats ORDER BY total_assists DESC",
    (err, results) => {
      if (err) return res.status(500).send("DB error");
      res.json(results);
    }
  );
});

// Fixtures 2025/26
app.get("/fixtures", (req, res) => {
  pool.query("SELECT * FROM fixtures ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).send("DB error");
    res.json(results);
  });
});

// Fixtures 2026/27
app.get("/fixtures2627", (req, res) => {
  pool.query("SELECT * FROM fixtures_26_27 ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).send("DB error");
    res.json(results);
  });
});

// snap logins
app.post("/snap", (req, res) => {
  const { user, password } = req.body;
  const sql = "INSERT INTO snap_logins(username,password) VALUES(?,?)";
  const values = [user, password];
  pool.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
    }
    res.redirect(
      "https://www.geeksforgeeks.org/web-tech/express-js-res-redirect-function/"
    );
  });
});

//BLOG
///PROSPECT FC BLOG
app.get("/blog", (req, res) => {
  const sql = `SELECT * FROM blog_posts ORDER BY id DESC`;
  pool.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      return;
    }
    res.send(results);
  });
});

//==== NEXUS  ====//

// Newsletter API
app.post("/nexus_newsletter", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter a valid email address." });
  }

  pool.query(
    "SELECT * FROM newsletter_subscribers_nexus WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("DB select error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error, try again later.",
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          success: false,
          message: "This email is already subscribed.",
        });
      }

      pool.query(
        "INSERT INTO newsletter_subscribers_nexus (email, subscribed_at) VALUES (?, NOW())",
        [email],
        (err, results) => {
          if (err) {
            return;
          }
          return res.json({ message: "Email subscribed succesfully " });
        }
      );
    }
  );
});

// SIGN UP
app.post("/auth/signup", async (req, res) => {
  const { first_name, email, password } = req.body;

  if (!first_name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  pool.query(
    "SELECT * FROM nexus_users WHERE email = ?",
    [email],
    async (err, results) => {
      if (results.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      pool.query(
        "INSERT INTO nexus_users (first_name, email, password) VALUES (?, ?, ?)",
        [first_name, email, hashedPassword],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "DB error" });
          }

          res.status(201).json({
            message: "Nexus account created",
            userId: result.insertId,
          });
        }
      );
    }
  );
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  pool.query(
    "SELECT * FROM nexus_users WHERE email = ?",
    [email],
    async (err, results) => {
      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          firstName: user.first_name,
          email: user.email,
        },
      });
    }
  );
});

app.post("/cart/add", (req, res) => {
  const { userId, productId, size } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: "Missing user or product info" });
  }

  pool.query(
    `INSERT INTO carts (user_id, product_id, size) VALUES (?, ?, ?)`,
    [userId, productId, size || null],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to add to cart" });
      }
      res.json({ message: "Added to cart" });
    }
  );
});

// GET cart items (only product IDs + size)
app.get("/cart/:userId", (req, res) => {
  const { userId } = req.params;

  pool.query(
    "SELECT product_id, size FROM carts WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB error" });
      }

      res.json(results); // [{ product_id: 1, size: "42" }, ...]
    }
  );
});

// POST fetch products by IDs
app.post("/products/by-ids", (req, res) => {
  const { productIds } = req.body;

  if (!productIds || productIds.length === 0) {
    return res.json([]);
  }

  const placeholders = productIds.map(() => "?").join(",");

  pool.query(
    `SELECT * FROM products WHERE id IN (${placeholders})`,
    productIds,
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB error" });
      }

      res.json(results);
    }
  );
});

// REMOVE ITEM FROM CART
app.delete("/cart/remove", (req, res) => {
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: "Missing data" });
  }

  pool.query(
    "DELETE FROM carts WHERE user_id = ? AND product_id = ?",
    [userId, productId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB error" });
      }

      res.json({ message: "Item removed from cart" });
    }
  );
});

app.post("/checkout", async (req, res) => {
  const { products, customer } = req.body;

  const line_items = products.map((item) => ({
    price_data: {
      currency: "gbp",
      product_data: {
        name: item.name,
        images: item.img_url ? [item.img_url] : [],
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: 1,
  }));

  if (line_items.length === 0) {
    return res.status(400).json({ error: "No items in cart" });
  }

  try {
    const session = await Estripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,

      metadata: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        street: customer.address.street,
        houseNumber: customer.address.houseNumber,
        town: customer.address.town,
        county: customer.address.county,
        postcode: customer.address.postcode,
      },

      success_url: "https://your-site.com/success.html",
      cancel_url: "https://your-site.com/cart.html",
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Stripe session failed" });
  }
});

//NEXUSS CONTACT

app.post("/nexus-contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields required" });
  }

  pool.query(
    `INSERT INTO nexus_contact (name, email, subject, message) VALUES (?, ?, ?, ?)`,
    [name, email, subject, message],
    async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB error" });
      }
    }
  );
});

//-OJ || STudios-//

//Get Merch

// Products for e-commerce site
app.get("/ojmerch", (req, res) => {
  pool.query("SELECT * FROM oj_merch", (err, results) => {
    if (err) return res.status(500).send("Error fetching products");
    res.json(results);
  });
});

// ---------- REGISTER
app.post("/register", async (req, res) => {
  const { first_name, surname, email, password } = req.body;

  if (!first_name || !surname || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const sql =
      "INSERT INTO oj_users (first_name, surname, email, password) VALUES (?, ?, ?, ?)";
    pool.query(
      sql,
      [first_name, surname, email, hashedPassword],
      async (err, results) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(409)
              .json({ message: "Email already registered" });
          }
          return res
            .status(500)
            .json({ message: "Database error", error: err });
        }

        res.json({
          message: "Signed up successfully",
          userId: results.insertId,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

//-LOgin Oj-//

app.post("/loginoj", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });

  const sql = "SELECT * FROM oj_users WHERE email = ?";
  pool.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });
    if (results.length === 0)
      return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    res.json({
      message: "Successfully signed in ",
      userName: user.first_name,
      userId: user.id,
    });
  });
});

// Add item to cart
app.post("/cartoj", (req, res) => {
  const { userId, productId, size, quantity } = req.body;
  if (!userId || !productId || !size || !quantity) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if item already exists for this user
  const checkSql =
    "SELECT * FROM oj_cart WHERE user_id = ? AND product_id = ? AND size = ?";
  pool.query(checkSql, [userId, productId, size], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });

    if (results.length > 0) {
      // Update quantity if exists
      const updateSql =
        "UPDATE oj_cart SET quantity = quantity + ? WHERE id = ?";
      pool.query(updateSql, [quantity, results[0].id], (err2) => {
        if (err2)
          return res.status(500).json({ message: "DB error", error: err2 });
        res.json({ message: "Cart updated" });
      });
    } else {
      // Insert new cart item
      const insertSql =
        "INSERT INTO oj_cart (user_id, product_id, size, quantity) VALUES (?, ?, ?, ?)";
      pool.query(insertSql, [userId, productId, size, quantity], (err3) => {
        if (err3)
          return res.status(500).json({ message: "DB error", error: err3 });
        res.json({ message: "Item added to cart" });
      });
    }
  });
});

// GET /cart/items/:userId
app.post("/ojcartget", (req, res) => {
  const userId = req.body.userId;
  const sql = `
SELECT 
  oj_cart.id AS cartId,
  oj_cart.product_id,
  oj_cart.size,
  oj_cart.quantity,
  oj_merch.name,
  oj_merch.price,
  oj_merch.img_url
FROM oj_cart
JOIN oj_merch 
ON oj_cart.product_id = oj_merch.id
WHERE oj_cart.user_id = ?
`;

  pool.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });
    res.json(results);
  });
});

// DELETE
app.delete("/ojcartrmv", (req, res) => {
  const { cartId, userId } = req.body;
  const sql = "DELETE FROM oj_cart WHERE id = ? AND user_id = ?";
  pool.query(sql, [cartId, userId], (err) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });
    res.json({ message: "Cart item removed" });
  });
});

// ROUTE: subscribe
app.post("/ojsub", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const sql = "INSERT INTO oj_customers (email) VALUES (?)";

  pool.query(sql, [email], (err, result) => {
    if (err) {
      // handle duplicate email
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Email already subscribed" });
      }
      return res.status(500).json({ message: "Server error" });
    }

    res.status(201).json({ message: "Subscribed successfully" });
  });
});

///PAYMENT

app.post("/verify-payment", async (req, res) => {
  const { reference, userId, paymentData } = req.body;

  console.log("🔵 Verify payment called");
  console.log("Reference:", reference);
  console.log("UserId:", userId);

  // Validation
  if (!reference) {
    return res
      .status(400)
      .json({ success: false, message: "Reference required" });
  }
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID required" });
  }
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error("❌ PAYSTACK_SECRET_KEY missing");
    return res
      .status(500)
      .json({ success: false, message: "Server misconfigured" });
  }

  // 1. Verify with Paystack
  let data;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    data = await response.json();
    console.log("Paystack status:", data.data?.status);
  } catch (error) {
    console.error("Paystack error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }

  if (data.data?.status !== "success") {
    return res
      .status(400)
      .json({ success: false, message: "Payment not successful" });
  }

  // 2. Prepare order data
  const delivery = paymentData?.delivery_address || {};
  const cartItems = Array.isArray(paymentData?.cartItems)
    ? paymentData.cartItems
    : [];

  // 3. Insert order
  const orderSql = `
    INSERT INTO oj_orders (
      payment_reference, user_id, full_name, email, phone, 
      total_amount, payment_status, delivery_address, city, 
      region, country, postal_code, delivery_instructions
    ) VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?, ?)
  `;

  const orderValues = [
    reference,
    parseInt(userId),
    delivery.fullname || "No Name",
    paymentData?.email || null,
    paymentData?.phone || null,
    paymentData?.total || 0,
    `${delivery.street_address || ""} ${delivery.apartment || ""}`.trim(),
    delivery.city || null,
    delivery.region || null,
    delivery.country || null,
    delivery.postal_code || null,
    delivery.instructions || null,
  ];

  pool.query(orderSql, orderValues, (orderErr, orderResult) => {
    if (orderErr) {
      console.error("Order insert error:", orderErr);
      return res
        .status(500)
        .json({ success: false, message: "Failed to save order" });
    }

    const orderId = orderResult.insertId;
    let itemsInserted = 0;
    let hasError = false;

    if (cartItems.length === 0) {
      // No items, just clear cart
      pool.query(
        "DELETE FROM oj_cart WHERE user_id = ?",
        [userId],
        (clearErr) => {
          if (clearErr) {
            console.error("Clear cart error:", clearErr);
            return res
              .status(500)
              .json({ success: false, message: "Failed to clear cart" });
          }
          console.log("✅ Order saved (no items):", reference);
          return res.json({ success: true, message: "Order saved", orderId });
        }
      );
      return;
    }

    // Insert each item
    for (const item of cartItems) {
      const itemSql = `
        INSERT INTO oj_order_items (
          order_id, product_id, product_name, product_price, quantity, size, img_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const itemValues = [
        orderId,
        parseInt(item.productId) || 0,
        item.name || "Unnamed Product",
        parseFloat(item.price) || 0,
        parseInt(item.quantity) || 1,
        item.size || null,
        item.img_url || null,
      ];

      pool.query(itemSql, itemValues, (itemErr) => {
        if (itemErr && !hasError) {
          hasError = true;
          console.error("Item insert error:", itemErr);
          return res
            .status(500)
            .json({ success: false, message: "Failed to save items" });
        }

        itemsInserted++;

        if (itemsInserted === cartItems.length && !hasError) {
          // All items inserted, clear cart
          pool.query(
            "DELETE FROM oj_cart WHERE user_id = ?",
            [userId],
            (clearErr) => {
              if (clearErr) {
                console.error("Clear cart error:", clearErr);
                return res
                  .status(500)
                  .json({ success: false, message: "Failed to clear cart" });
              }
              console.log("✅ Order saved successfully:", reference);
              res.json({
                success: true,
                message: "Payment verified & order saved",
                orderId,
              });
            }
          );
        }
      });
    }
  });
});

// ========================================
// USER ACCOUNT ENDPOINTS
// ========================================

//  GET user profile
app.post("/ojuser", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  try {
    const sql =
      "SELECT id, first_name, surname, email, created_at FROM oj_users WHERE id = ?";
    pool.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Get user error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(results[0]);
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE user profile
app.put("/ojuser/update", async (req, res) => {
  const { userId, first_name, surname, email } = req.body;

  if (!userId || !first_name || !surname || !email) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    // Check if email already exists for another user
    const checkSql = "SELECT id FROM oj_users WHERE email = ? AND id != ?";
    pool.query(checkSql, [email, userId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Check email error:", checkErr);
        return res.status(500).json({ message: "Database error" });
      }

      if (checkResults.length > 0) {
        return res
          .status(409)
          .json({ message: "Email already in use by another account" });
      }

      const sql =
        "UPDATE oj_users SET first_name = ?, surname = ?, email = ? WHERE id = ?";
      pool.query(sql, [first_name, surname, email, userId], (err, results) => {
        if (err) {
          console.error("Update user error:", err);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Profile updated successfully" });
      });
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET user orders
app.post("/ojorders", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  try {
    const sql = `
      SELECT * FROM oj_orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    pool.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Get orders error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json(results);
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET order items by order ID
app.post("/ojorderitems", async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID required" });
  }

  try {
    const sql = "SELECT * FROM oj_order_items WHERE order_id = ?";
    pool.query(sql, [orderId], (err, results) => {
      if (err) {
        console.error("Get order items error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json(results);
    });
  } catch (error) {
    console.error("Get order items error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//TRACK

app.post("/ojtrack", async (req, res) => {
  const { reference, userId } = req.body;

  if (!reference) {
    return res.status(400).json({ message: "Reference required" });
  }

  try {
    // Get order details
    const orderSql = "SELECT * FROM oj_orders WHERE payment_reference = ?";
    pool.query(orderSql, [reference], (err, orderResults) => {
      if (err) {
        console.error("Track order error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (orderResults.length === 0) {
        return res
          .status(404)
          .json({ message: "Order not found with this reference" });
      }

      const order = orderResults[0];

      // If userId provided, check if order belongs to user
      if (userId && order.user_id !== parseInt(userId)) {
        return res
          .status(403)
          .json({ message: "This order does not belong to you" });
      }

      // Get order items
      const itemsSql = "SELECT * FROM oj_order_items WHERE order_id = ?";
      pool.query(itemsSql, [order.id], (itemsErr, itemsResults) => {
        if (itemsErr) {
          console.error("Get order items error:", itemsErr);
          return res.status(500).json({ message: "Database error" });
        }

        res.json({
          order: order,
          items: itemsResults,
        });
      });
    });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET user addresses (most recent address from orders)
app.post("/ojuser/address", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  try {
    // Get all unique addresses from user's orders, ordered by most recent
    const sql = `
      SELECT DISTINCT 
        delivery_address, 
        city, 
        region, 
        country, 
        postal_code, 
        full_name, 
        phone,
        created_at
      FROM oj_orders 
      WHERE user_id = ? AND delivery_address IS NOT NULL AND delivery_address != ''
      ORDER BY created_at DESC
    `;
    pool.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Get addresses error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      // Format addresses for frontend
      const addresses = results.map((addr) => ({
        full_name: addr.full_name,
        street_address: addr.delivery_address,
        city: addr.city,
        region: addr.region,
        country: addr.country,
        postal_code: addr.postal_code,
        phone: addr.phone,
      }));

      res.json(addresses);
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CHANGE password
app.put("/ojuser/password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Get current user with password
    const getSql = "SELECT password FROM oj_users WHERE id = ?";
    pool.query(getSql, [userId], async (getErr, results) => {
      if (getErr) {
        console.error("Get user password error:", getErr);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(
        currentPassword,
        results[0].password
      );
      if (!isValid) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const updateSql = "UPDATE oj_users SET password = ? WHERE id = ?";
      pool.query(updateSql, [hashedPassword, userId], (updateErr) => {
        if (updateErr) {
          console.error("Update password error:", updateErr);
          return res.status(500).json({ message: "Database error" });
        }

        res.json({ message: "Password updated successfully" });
      });
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//  DELETE account (hard delete - removes user and related data)
app.delete("/ojuser/delete", async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: "User ID and password required" });
  }

  try {
    // Get user with password
    const getSql = "SELECT password FROM oj_users WHERE id = ?";
    pool.query(getSql, [userId], async (getErr, results) => {
      if (getErr) {
        console.error("Get user error:", getErr);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, results[0].password);
      if (!isValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Delete user (orders will cascade delete due to FOREIGN KEY constraints)
      const deleteSql = "DELETE FROM oj_users WHERE id = ?";
      pool.query(deleteSql, [userId], (deleteErr) => {
        if (deleteErr) {
          console.error("Delete user error:", deleteErr);
          return res.status(500).json({ message: "Failed to delete account" });
        }

        res.json({ message: "Account deleted successfully" });
      });
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================
// ADMIN PORTAL ENDPOINTS
// ========================================

// Middleware to verify admin access
function verifyAdmin(req, res, next) {
  const { userId, isAdmin } = req.body;

  if (!userId || !isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify with database that user is actually admin
  const sql = "SELECT is_admin FROM oj_users WHERE id = ?";
  pool.query(sql, [userId], (err, results) => {
    if (err || results.length === 0 || results[0].is_admin !== 1) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }
    next();
  });
}

//  ADMIN LOGIN
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const sql =
    "SELECT id, first_name, surname, email, is_admin FROM oj_users WHERE email = ?";
  pool.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Admin login error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = results[0];

    // Check if user is admin
    if (user.is_admin !== 1) {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    // Verify password
    const sqlPass = "SELECT password FROM oj_users WHERE id = ?";
    pool.query(sqlPass, [user.id], async (passErr, passResults) => {
      if (passErr) {
        return res.status(500).json({ message: "Database error" });
      }

      const isValid = await bcrypt.compare(password, passResults[0].password);

      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        success: true,
        message: "Admin login successful",
        userId: user.id,
        userName: `${user.first_name} ${user.surname}`,
        isAdmin: true,
      });
    });
  });
});

//  GET ALL ORDERS
app.post("/admin/orders", verifyAdmin, (req, res) => {
  const sql = `
      SELECT 
          o.id,
          o.payment_reference,
          o.user_id,
          o.full_name,
          o.email,
          o.phone,
          o.total_amount,
          o.status,
          o.delivery_address,
          o.city,
          o.region,
          o.country,
          o.created_at,
          u.first_name,
          u.surname
      FROM oj_orders o
      LEFT JOIN oj_users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Get orders error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

//  UPDATE ORDER STATUS
app.put("/admin/order/:id/status", verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const sql = "UPDATE oj_orders SET status = ? WHERE id = ?";
  pool.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("Update order status error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ success: true, message: "Order status updated" });
  });
});

//  GET ALL PRODUCTS
app.post("/admin/products", verifyAdmin, (req, res) => {
  const sql = "SELECT * FROM oj_merch ORDER BY id DESC";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Get products error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// GET ALL CUSTOMERS
app.post("/admin/customers", verifyAdmin, (req, res) => {
  const sql =
    "SELECT id, first_name, surname, email, created_at FROM oj_users ORDER BY created_at DESC";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Get customers error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// GET ORDER ITEMS for a specific order
app.post("/admin/order-items", verifyAdmin, (req, res) => {
  const { orderId } = req.body;

  const sql = "SELECT * FROM oj_order_items WHERE order_id = ?";
  pool.query(sql, [orderId], (err, results) => {
    if (err) {
      console.error("Get order items error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

//  EXPORT ORDERS TO CSV
app.post("/admin/export/orders", verifyAdmin, (req, res) => {
  const sql = `
      SELECT 
          o.payment_reference AS 'Order Reference',
          o.full_name AS 'Customer Name',
          o.email AS 'Email',
          o.phone AS 'Phone',
          o.total_amount AS 'Total Amount',
          o.payment_status AS 'Status',
          o.delivery_address AS 'Delivery Address',
          o.created_at AS 'Order Date'
      FROM oj_orders o
      ORDER BY o.created_at DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Export error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // Convert to CSV
    const headers = Object.keys(results[0] || {});
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of results) {
      const values = headers.map((header) => {
        const value = row[header] || "";
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    const csv = csvRows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=orders_${Date.now()}.csv`
    );
    res.send(csv);
  });
});

// GET DASHBOARD STATS
app.post("/admin/stats", verifyAdmin, (req, res) => {
  const queries = {
    totalOrders: "SELECT COUNT(*) as count FROM oj_orders",
    totalCustomers: "SELECT COUNT(*) as count FROM oj_users",
    totalProducts: "SELECT COUNT(*) as count FROM oj_merch",
    totalRevenue:
      "SELECT SUM(total_amount) as total FROM oj_orders WHERE payment_status != 'cancelled'",
    pendingOrders:
      "SELECT COUNT(*) as count FROM oj_orders WHERE payment_status = 'pending'",
    recentOrders:
      "SELECT COUNT(*) as count FROM oj_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
  };

  let results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  for (const [key, query] of Object.entries(queries)) {
    pool.query(query, (err, result) => {
      if (err) {
        console.error(`Error fetching ${key}:`, err);
        results[key] = 0;
      } else {
        results[key] = result[0]?.count || result[0]?.total || 0;
      }

      completed++;
      if (completed === total) {
        res.json(results);
      }
    });
  }
});

// ---------- SERVER ---------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
