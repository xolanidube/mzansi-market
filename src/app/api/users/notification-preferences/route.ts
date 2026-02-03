import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NotificationType, NotificationFrequency } from "@prisma/client";

const updatePreferenceSchema = z.object({
  notificationType: z.nativeEnum(NotificationType),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  frequency: z.nativeEnum(NotificationFrequency).optional(),
});

const bulkUpdateSchema = z.object({
  preferences: z.array(updatePreferenceSchema),
});

// Default notification preferences for new users
const DEFAULT_PREFERENCES: Array<{
  notificationType: NotificationType;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  frequency: NotificationFrequency;
}> = [
  {
    notificationType: "BOOKING_NEW",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    frequency: "REALTIME",
  },
  {
    notificationType: "BOOKING_CONFIRMED",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    frequency: "REALTIME",
  },
  {
    notificationType: "BOOKING_CANCELLED",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    frequency: "REALTIME",
  },
  {
    notificationType: "BOOKING_COMPLETED",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: false,
    frequency: "REALTIME",
  },
  {
    notificationType: "MESSAGE_NEW",
    emailEnabled: false,
    inAppEnabled: true,
    pushEnabled: true,
    frequency: "REALTIME",
  },
  {
    notificationType: "REVIEW_NEW",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: false,
    frequency: "DAILY_DIGEST",
  },
  {
    notificationType: "JOB_APPLICATION",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    frequency: "REALTIME",
  },
  {
    notificationType: "JOB_ACCEPTED",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    frequency: "REALTIME",
  },
  {
    notificationType: "ORDER_UPDATE",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    frequency: "REALTIME",
  },
  {
    notificationType: "PAYMENT_RECEIVED",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    frequency: "REALTIME",
  },
  {
    notificationType: "PAYMENT_FAILED",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: true,
    frequency: "REALTIME",
  },
  {
    notificationType: "SYSTEM",
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: false,
    frequency: "REALTIME",
  },
];

// GET /api/users/notification-preferences - Get user's notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing preferences
    let preferences = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id },
    });

    // If no preferences exist, create defaults
    if (preferences.length === 0) {
      await prisma.notificationPreference.createMany({
        data: DEFAULT_PREFERENCES.map((pref) => ({
          ...pref,
          userId: session.user.id,
        })),
      });

      preferences = await prisma.notificationPreference.findMany({
        where: { userId: session.user.id },
      });
    }

    // Ensure all notification types have preferences
    const existingTypes = new Set(preferences.map((p) => p.notificationType));
    const missingDefaults = DEFAULT_PREFERENCES.filter(
      (d) => !existingTypes.has(d.notificationType)
    );

    if (missingDefaults.length > 0) {
      await prisma.notificationPreference.createMany({
        data: missingDefaults.map((pref) => ({
          ...pref,
          userId: session.user.id,
        })),
      });

      preferences = await prisma.notificationPreference.findMany({
        where: { userId: session.user.id },
      });
    }

    return NextResponse.json({
      preferences: preferences.map((p) => ({
        id: p.id,
        notificationType: p.notificationType,
        emailEnabled: p.emailEnabled,
        inAppEnabled: p.inAppEnabled,
        pushEnabled: p.pushEnabled,
        frequency: p.frequency,
      })),
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/notification-preferences - Update a single preference
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationType, ...updates } = updatePreferenceSchema.parse(body);

    // Find or create the preference
    let preference = await prisma.notificationPreference.findUnique({
      where: {
        userId_notificationType: {
          userId: session.user.id,
          notificationType,
        },
      },
    });

    if (!preference) {
      // Create with defaults
      const defaultPref = DEFAULT_PREFERENCES.find(
        (d) => d.notificationType === notificationType
      );

      preference = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          notificationType,
          emailEnabled: defaultPref?.emailEnabled ?? true,
          inAppEnabled: defaultPref?.inAppEnabled ?? true,
          pushEnabled: defaultPref?.pushEnabled ?? false,
          frequency: defaultPref?.frequency ?? "REALTIME",
          ...updates,
        },
      });
    } else {
      // Update existing
      preference = await prisma.notificationPreference.update({
        where: { id: preference.id },
        data: updates,
      });
    }

    return NextResponse.json({
      success: true,
      preference: {
        id: preference.id,
        notificationType: preference.notificationType,
        emailEnabled: preference.emailEnabled,
        inAppEnabled: preference.inAppEnabled,
        pushEnabled: preference.pushEnabled,
        frequency: preference.frequency,
      },
    });
  } catch (error) {
    console.error("Error updating notification preference:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update notification preference" },
      { status: 500 }
    );
  }
}

// PUT /api/users/notification-preferences - Bulk update preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = bulkUpdateSchema.parse(body);

    // Update each preference
    const updates = await Promise.all(
      preferences.map(async ({ notificationType, ...updates }) => {
        return prisma.notificationPreference.upsert({
          where: {
            userId_notificationType: {
              userId: session.user.id,
              notificationType,
            },
          },
          create: {
            userId: session.user.id,
            notificationType,
            emailEnabled: updates.emailEnabled ?? true,
            inAppEnabled: updates.inAppEnabled ?? true,
            pushEnabled: updates.pushEnabled ?? false,
            frequency: updates.frequency ?? "REALTIME",
          },
          update: updates,
        });
      })
    );

    return NextResponse.json({
      success: true,
      updated: updates.length,
    });
  } catch (error) {
    console.error("Error bulk updating notification preferences:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
