import nodemailer from "nodemailer";

// Email configuration - uses environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || "noreply@mzansimarket.co.za";
const SITE_NAME = "Mzansi Market";
const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Email templates
const templates = {
  // Base template wrapper
  base: (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SITE_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .button:hover { background: #1d4ed8; }
    .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .highlight { color: #2563eb; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${SITE_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</p>
      <p>123 Main Street, Sandton, Johannesburg, South Africa</p>
    </div>
  </div>
</body>
</html>
  `,

  // Welcome email
  welcome: (username: string) => templates.base(`
    <h2>Welcome to ${SITE_NAME}! 🎉</h2>
    <p>Hi <strong>${username}</strong>,</p>
    <p>Thank you for joining ${SITE_NAME}! We're excited to have you on board.</p>
    <p>With your new account, you can:</p>
    <ul>
      <li>Browse and book services from verified providers</li>
      <li>Post jobs and find skilled professionals</li>
      <li>Connect with service providers in your area</li>
      <li>Leave reviews and help our community</li>
    </ul>
    <a href="${SITE_URL}/dashboard" class="button">Go to Dashboard</a>
    <p>If you have any questions, feel free to <a href="${SITE_URL}/contact">contact us</a>.</p>
    <p>Best regards,<br>The ${SITE_NAME} Team</p>
  `),

  // Booking confirmation (for customer)
  bookingConfirmation: (data: {
    customerName: string;
    serviceName: string;
    providerName: string;
    date: string;
    time: string;
    address?: string;
    bookingId: string;
  }) => templates.base(`
    <h2>Booking Confirmed! ✅</h2>
    <p>Hi <strong>${data.customerName}</strong>,</p>
    <p>Your booking has been confirmed. Here are the details:</p>
    <div class="info-box">
      <p><strong>Service:</strong> ${data.serviceName}</p>
      <p><strong>Provider:</strong> ${data.providerName}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.time}</p>
      ${data.address ? `<p><strong>Location:</strong> ${data.address}</p>` : ""}
      <p><strong>Booking ID:</strong> ${data.bookingId}</p>
    </div>
    <a href="${SITE_URL}/dashboard/bookings/${data.bookingId}" class="button">View Booking Details</a>
    <p>Need to make changes? You can manage your booking from your dashboard.</p>
    <p>Best regards,<br>The ${SITE_NAME} Team</p>
  `),

  // New booking notification (for provider)
  newBookingNotification: (data: {
    providerName: string;
    customerName: string;
    serviceName: string;
    date: string;
    time: string;
    bookingId: string;
  }) => templates.base(`
    <h2>New Booking Request! 📅</h2>
    <p>Hi <strong>${data.providerName}</strong>,</p>
    <p>You have received a new booking request:</p>
    <div class="info-box">
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Service:</strong> ${data.serviceName}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.time}</p>
    </div>
    <a href="${SITE_URL}/dashboard/bookings/${data.bookingId}" class="button">View & Confirm Booking</a>
    <p>Please confirm or respond to this booking as soon as possible.</p>
    <p>Best regards,<br>The ${SITE_NAME} Team</p>
  `),

  // Booking status update
  bookingStatusUpdate: (data: {
    customerName: string;
    serviceName: string;
    status: string;
    bookingId: string;
  }) => templates.base(`
    <h2>Booking Update</h2>
    <p>Hi <strong>${data.customerName}</strong>,</p>
    <p>Your booking status has been updated:</p>
    <div class="info-box">
      <p><strong>Service:</strong> ${data.serviceName}</p>
      <p><strong>New Status:</strong> <span class="highlight">${data.status}</span></p>
    </div>
    <a href="${SITE_URL}/dashboard/bookings/${data.bookingId}" class="button">View Booking</a>
    <p>Best regards,<br>The ${SITE_NAME} Team</p>
  `),

  // Email verification
  emailVerification: (data: { username: string; verificationLink: string }) => templates.base(`
    <h2>Verify Your Email Address</h2>
    <p>Hi <strong>${data.username}</strong>,</p>
    <p>Thank you for creating an account with ${SITE_NAME}. Please verify your email address to complete your registration.</p>
    <a href="${data.verificationLink}" class="button">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account with us, you can safely ignore this email.</p>
    <p>Best regards,<br>The ${SITE_NAME} Team</p>
  `),

  // Password reset
  passwordReset: (data: { username: string; resetLink: string }) => templates.base(`
    <h2>Password Reset Request</h2>
    <p>Hi <strong>${data.username}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <a href="${data.resetLink}" class="button">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <p>Best regards,<br>The ${SITE_NAME} Team</p>
  `),

  // Contact form submission
  contactFormSubmission: (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => templates.base(`
    <h2>New Contact Form Submission</h2>
    <div class="info-box">
      <p><strong>From:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
      <p><strong>Subject:</strong> ${data.subject}</p>
    </div>
    <h3>Message:</h3>
    <p>${data.message.replace(/\n/g, "<br>")}</p>
  `),

  // New message notification
  newMessageNotification: (data: {
    recipientName: string;
    senderName: string;
    preview: string;
  }) => templates.base(`
    <h2>New Message 💬</h2>
    <p>Hi <strong>${data.recipientName}</strong>,</p>
    <p>You have received a new message from <strong>${data.senderName}</strong>:</p>
    <div class="info-box">
      <p>"${data.preview}..."</p>
    </div>
    <a href="${SITE_URL}/dashboard/messages" class="button">View Message</a>
    <p>Best regards,<br>The ${SITE_NAME} Team</p>
  `),

  // Review notification
  newReviewNotification: (data: {
    providerName: string;
    reviewerName: string;
    rating: number;
    reviewText?: string;
  }) => templates.base(`
    <h2>New Review Received! ⭐</h2>
    <p>Hi <strong>${data.providerName}</strong>,</p>
    <p>You have received a new ${data.rating}-star review from <strong>${data.reviewerName}</strong>:</p>
    ${data.reviewText ? `
    <div class="info-box">
      <p>"${data.reviewText}"</p>
    </div>
    ` : ""}
    <a href="${SITE_URL}/dashboard/reviews" class="button">View All Reviews</a>
    <p>Best regards,<br>The ${SITE_NAME} Team</p>
  `),

  // Order confirmation
  orderConfirmation: (data: {
    customerName: string;
    orderId: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
  }) => templates.base(`
    <h2>Order Confirmed! 🛒</h2>
    <p>Hi <strong>${data.customerName}</strong>,</p>
    <p>Thank you for your order. Here are your order details:</p>
    <div class="info-box">
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <th style="text-align: left; padding: 8px;">Item</th>
          <th style="text-align: center; padding: 8px;">Qty</th>
          <th style="text-align: right; padding: 8px;">Price</th>
        </tr>
        ${data.items.map(item => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px;">${item.name}</td>
          <td style="text-align: center; padding: 8px;">${item.quantity}</td>
          <td style="text-align: right; padding: 8px;">R ${item.price.toFixed(2)}</td>
        </tr>
        `).join("")}
        <tr>
          <td colspan="2" style="text-align: right; padding: 8px;"><strong>Total:</strong></td>
          <td style="text-align: right; padding: 8px;"><strong>R ${data.total.toFixed(2)}</strong></td>
        </tr>
      </table>
    </div>
    <a href="${SITE_URL}/dashboard/orders/${data.orderId}" class="button">View Order</a>
    <p>Best regards,<br>The ${SITE_NAME} Team</p>
  `),
};

// Email sending functions
export async function sendEmail(to: string, subject: string, html: string) {
  // Check if email is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Email not configured. Would send to:", to);
    console.log("Subject:", subject);
    return { success: true, message: "Email logged (SMTP not configured)" };
  }

  try {
    await transporter.sendMail({
      from: `"${SITE_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}

// Convenience functions
export async function sendWelcomeEmail(to: string, username: string) {
  return sendEmail(to, `Welcome to ${SITE_NAME}!`, templates.welcome(username));
}

export async function sendBookingConfirmation(
  to: string,
  data: Parameters<typeof templates.bookingConfirmation>[0]
) {
  return sendEmail(to, "Your Booking is Confirmed!", templates.bookingConfirmation(data));
}

export async function sendNewBookingNotification(
  to: string,
  data: Parameters<typeof templates.newBookingNotification>[0]
) {
  return sendEmail(to, "New Booking Request", templates.newBookingNotification(data));
}

export async function sendBookingStatusUpdate(
  to: string,
  data: Parameters<typeof templates.bookingStatusUpdate>[0]
) {
  return sendEmail(to, `Booking Update: ${data.status}`, templates.bookingStatusUpdate(data));
}

export async function sendVerificationEmail(
  to: string,
  data: Parameters<typeof templates.emailVerification>[0]
) {
  return sendEmail(to, `Verify your ${SITE_NAME} email`, templates.emailVerification(data));
}

export async function sendPasswordResetEmail(
  to: string,
  data: Parameters<typeof templates.passwordReset>[0]
) {
  return sendEmail(to, "Password Reset Request", templates.passwordReset(data));
}

export async function sendContactFormEmail(
  data: Parameters<typeof templates.contactFormSubmission>[0]
) {
  const adminEmail = process.env.ADMIN_EMAIL || "support@mzansimarket.co.za";
  return sendEmail(adminEmail, `Contact Form: ${data.subject}`, templates.contactFormSubmission(data));
}

export async function sendNewMessageNotification(
  to: string,
  data: Parameters<typeof templates.newMessageNotification>[0]
) {
  return sendEmail(to, `New message from ${data.senderName}`, templates.newMessageNotification(data));
}

export async function sendNewReviewNotification(
  to: string,
  data: Parameters<typeof templates.newReviewNotification>[0]
) {
  return sendEmail(to, "You received a new review!", templates.newReviewNotification(data));
}

export async function sendOrderConfirmation(
  to: string,
  data: Parameters<typeof templates.orderConfirmation>[0]
) {
  return sendEmail(to, `Order Confirmed #${data.orderId}`, templates.orderConfirmation(data));
}
