import { prisma } from "@/lib/prisma";

type NotificationType =
  | "BOOKING_NEW"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "MESSAGE_NEW"
  | "REVIEW_NEW"
  | "JOB_APPLICATION"
  | "JOB_ACCEPTED"
  | "ORDER_UPDATE"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "SYSTEM";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Create a booking notification for the provider
 */
export async function notifyNewBooking(
  providerId: string,
  customerName: string,
  serviceName: string,
  bookingId: string,
  date: string
) {
  return createNotification({
    userId: providerId,
    type: "BOOKING_NEW",
    title: "New Booking Request",
    message: `${customerName} has booked ${serviceName} for ${date}`,
    link: `/dashboard/bookings/${bookingId}`,
    metadata: { bookingId, customerName, serviceName },
  });
}

/**
 * Create a booking confirmation notification for the customer
 */
export async function notifyBookingConfirmed(
  customerId: string,
  providerName: string,
  serviceName: string,
  bookingId: string
) {
  return createNotification({
    userId: customerId,
    type: "BOOKING_CONFIRMED",
    title: "Booking Confirmed",
    message: `Your booking for ${serviceName} with ${providerName} has been confirmed`,
    link: `/dashboard/bookings/${bookingId}`,
    metadata: { bookingId, providerName, serviceName },
  });
}

/**
 * Create a booking cancellation notification
 */
export async function notifyBookingCancelled(
  userId: string,
  serviceName: string,
  bookingId: string,
  cancelledBy: string
) {
  return createNotification({
    userId,
    type: "BOOKING_CANCELLED",
    title: "Booking Cancelled",
    message: `The booking for ${serviceName} has been cancelled by ${cancelledBy}`,
    link: `/dashboard/bookings/${bookingId}`,
    metadata: { bookingId, serviceName, cancelledBy },
  });
}

/**
 * Create a new message notification
 */
export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  preview: string
) {
  return createNotification({
    userId: recipientId,
    type: "MESSAGE_NEW",
    title: "New Message",
    message: `${senderName}: ${preview.substring(0, 50)}${preview.length > 50 ? "..." : ""}`,
    link: "/dashboard/messages",
    metadata: { senderName },
  });
}

/**
 * Create a new review notification
 */
export async function notifyNewReview(
  providerId: string,
  reviewerName: string,
  rating: number,
  serviceName: string
) {
  return createNotification({
    userId: providerId,
    type: "REVIEW_NEW",
    title: "New Review",
    message: `${reviewerName} left a ${rating}-star review for ${serviceName}`,
    link: "/dashboard/reviews",
    metadata: { reviewerName, rating, serviceName },
  });
}

/**
 * Create a job application notification
 */
export async function notifyJobApplication(
  employerId: string,
  applicantName: string,
  jobTitle: string,
  jobId: string,
  applicationId: string
) {
  return createNotification({
    userId: employerId,
    type: "JOB_APPLICATION",
    title: "New Job Application",
    message: `${applicantName} applied for ${jobTitle}`,
    link: `/dashboard/jobs/${jobId}/applications`,
    metadata: { applicantName, jobTitle, jobId, applicationId },
  });
}

/**
 * Create a job acceptance notification
 */
export async function notifyJobAccepted(
  applicantId: string,
  employerName: string,
  jobTitle: string,
  jobId: string
) {
  return createNotification({
    userId: applicantId,
    type: "JOB_ACCEPTED",
    title: "Application Accepted",
    message: `Your application for ${jobTitle} has been accepted by ${employerName}`,
    link: `/jobs/${jobId}`,
    metadata: { employerName, jobTitle, jobId },
  });
}

/**
 * Create an order update notification
 */
export async function notifyOrderUpdate(
  customerId: string,
  orderId: string,
  status: string
) {
  return createNotification({
    userId: customerId,
    type: "ORDER_UPDATE",
    title: "Order Update",
    message: `Your order #${orderId.substring(0, 8)} is now ${status.toLowerCase()}`,
    link: `/dashboard/orders/${orderId}`,
    metadata: { orderId, status },
  });
}

/**
 * Create a payment received notification
 */
export async function notifyPaymentReceived(
  providerId: string,
  amount: number,
  serviceName: string,
  paymentId: string
) {
  return createNotification({
    userId: providerId,
    type: "PAYMENT_RECEIVED",
    title: "Payment Received",
    message: `You received R${amount.toFixed(2)} for ${serviceName}`,
    link: "/dashboard/wallet",
    metadata: { amount, serviceName, paymentId },
  });
}

/**
 * Create a payment failed notification
 */
export async function notifyPaymentFailed(
  userId: string,
  amount: number,
  reason?: string
) {
  return createNotification({
    userId,
    type: "PAYMENT_FAILED",
    title: "Payment Failed",
    message: `Payment of R${amount.toFixed(2)} failed${reason ? `: ${reason}` : ""}`,
    link: "/dashboard/wallet",
    metadata: { amount, reason },
  });
}

/**
 * Create a system notification
 */
export async function notifySystem(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  return createNotification({
    userId,
    type: "SYSTEM",
    title,
    message,
    link,
  });
}
