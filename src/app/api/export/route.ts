import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ExportFormat = "json" | "csv";
type ExportType = "appointments" | "orders" | "reviews" | "services" | "payments";

function toCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (data.length === 0) return "";

  const keys = headers || Object.keys(data[0]);
  const headerRow = keys.join(",");

  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key];
        if (value === null || value === undefined) return "";
        if (typeof value === "string") {
          // Escape quotes and wrap in quotes if contains comma
          const escaped = value.replace(/"/g, '""');
          return escaped.includes(",") || escaped.includes("\n")
            ? `"${escaped}"`
            : escaped;
        }
        if (value instanceof Date) return value.toISOString();
        if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return String(value);
      })
      .join(",")
  );

  return [headerRow, ...rows].join("\n");
}

// GET /api/export?type=appointments&format=csv
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ExportType;
    const format = (searchParams.get("format") || "json") as ExportFormat;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!type) {
      return NextResponse.json(
        { error: "Export type is required (appointments, orders, reviews, services, payments)" },
        { status: 400 }
      );
    }

    const dateFilter: Record<string, unknown> = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    let data: Record<string, unknown>[] = [];
    let filename = "";

    switch (type) {
      case "appointments": {
        const appointments = await prisma.appointment.findMany({
          where: {
            OR: [
              { requesterId: session.user.id },
              { providerId: session.user.id },
            ],
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
          },
          include: {
            requester: { select: { username: true, email: true } },
            provider: { select: { username: true, email: true } },
            service: { select: { name: true, price: true } },
          },
          orderBy: { date: "desc" },
        });

        data = appointments.map((a) => ({
          id: a.id,
          date: a.date,
          time: a.time,
          status: a.status,
          service: a.service?.name || a.services.join(", "),
          price: a.service?.price ? Number(a.service.price) : null,
          customer: a.requester.username,
          customerEmail: a.requester.email,
          provider: a.provider.username,
          providerEmail: a.provider.email,
          address: a.address,
          notes: a.note,
          paymentMode: a.paymentMode,
          createdAt: a.createdAt,
        }));
        filename = `appointments_${new Date().toISOString().split("T")[0]}`;
        break;
      }

      case "orders": {
        const orders = await prisma.order.findMany({
          where: {
            userId: session.user.id,
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
          },
          include: {
            items: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        data = orders.map((o) => ({
          orderNumber: o.orderNumber,
          status: o.status,
          totalAmount: Number(o.totalAmount),
          items: o.items.map((i) => `${i.product.name} x${i.quantity}`).join("; "),
          itemCount: o.items.length,
          address: o.address,
          notes: o.notes,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        }));
        filename = `orders_${new Date().toISOString().split("T")[0]}`;
        break;
      }

      case "reviews": {
        const reviews = await prisma.review.findMany({
          where: {
            OR: [
              { senderId: session.user.id },
              { receiverId: session.user.id },
            ],
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
          },
          include: {
            sender: { select: { username: true } },
            receiver: { select: { username: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        data = reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          reviewText: r.text,
          reviewer: r.sender.username,
          reviewee: r.receiver.username,
          type: r.senderId === session.user.id ? "given" : "received",
          providerResponse: r.providerResponse,
          providerResponseDate: r.providerResponseDate,
          createdAt: r.createdAt,
        }));
        filename = `reviews_${new Date().toISOString().split("T")[0]}`;
        break;
      }

      case "services": {
        const services = await prisma.service.findMany({
          where: {
            providerId: session.user.id,
          },
          include: {
            category: { select: { name: true } },
            _count: {
              select: {
                appointments: true,
                savedBy: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        data = services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: Number(s.price),
          chargeTime: s.chargeTime,
          category: s.category?.name,
          isActive: s.isActive,
          totalBookings: s._count.appointments,
          savedCount: s._count.savedBy,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
        filename = `services_${new Date().toISOString().split("T")[0]}`;
        break;
      }

      case "payments": {
        const payments = await prisma.payment.findMany({
          where: {
            userId: session.user.id,
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
          },
          include: {
            order: { select: { orderNumber: true } },
            appointment: {
              include: {
                service: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        data = payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          provider: p.provider,
          description: p.description,
          orderNumber: p.order?.orderNumber,
          serviceName: p.appointment?.service?.name,
          providerRef: p.providerRef,
          failureReason: p.failureReason,
          completedAt: p.completedAt,
          createdAt: p.createdAt,
        }));
        filename = `payments_${new Date().toISOString().split("T")[0]}`;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid export type" },
          { status: 400 }
        );
    }

    if (format === "csv") {
      const csv = toCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // JSON format
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
