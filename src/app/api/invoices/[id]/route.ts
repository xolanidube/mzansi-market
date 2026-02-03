import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// GET /api/invoices/[id] - Generate invoice PDF for an order or appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "order"; // order or appointment

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let invoiceData: any;

    if (type === "appointment") {
      // Fetch appointment data
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          service: {
            select: {
              name: true,
              price: true,
              chargeTime: true,
            },
          },
          requester: {
            select: {
              username: true,
              email: true,
              phone: true,
            },
          },
          provider: {
            select: {
              username: true,
              email: true,
              phone: true,
              shop: {
                select: {
                  name: true,
                  address: true,
                  contact: true,
                  tax: true,
                },
              },
            },
          },
        },
      });

      if (!appointment) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }

      // Verify user is part of this appointment
      if (appointment.requesterId !== session.user.id && appointment.providerId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const servicePrice = Number(appointment.service?.price || 0);
      const taxRate = Number(appointment.provider.shop?.tax || 0) / 100;
      const subtotal = servicePrice;
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      invoiceData = {
        invoiceNumber: `INV-APT-${appointment.id.substring(0, 8).toUpperCase()}`,
        date: new Date(appointment.createdAt).toLocaleDateString("en-ZA"),
        dueDate: new Date(appointment.date).toLocaleDateString("en-ZA"),
        type: "Service Booking",
        customer: {
          name: appointment.requester.username,
          email: appointment.requester.email,
          phone: appointment.requester.phone || "",
        },
        provider: {
          name: appointment.provider.shop?.name || appointment.provider.username,
          address: appointment.provider.shop?.address || "",
          contact: appointment.provider.shop?.contact || appointment.provider.phone || "",
          email: appointment.provider.email,
        },
        items: [
          {
            description: appointment.service?.name || "Service",
            quantity: 1,
            unitPrice: servicePrice,
            total: servicePrice,
          },
        ],
        subtotal,
        taxRate: taxRate * 100,
        tax,
        total,
        appointmentDate: new Date(appointment.date).toLocaleDateString("en-ZA"),
        appointmentTime: appointment.time,
        status: appointment.status,
      };
    } else {
      // Fetch order data
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          },
          user: {
            select: {
              username: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const subtotal = Number(order.totalAmount);
      const taxRate = 0.15; // 15% VAT
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      invoiceData = {
        invoiceNumber: `INV-ORD-${order.id.substring(0, 8).toUpperCase()}`,
        date: new Date(order.createdAt).toLocaleDateString("en-ZA"),
        dueDate: new Date().toLocaleDateString("en-ZA"),
        type: "Product Order",
        customer: {
          name: order.user.username,
          email: order.user.email,
          phone: order.user.phone || "",
        },
        provider: {
          name: "Mzansi Market",
          address: "123 Main Street, Sandton, Johannesburg",
          contact: "+27 11 123 4567",
          email: "orders@mzansimarket.co.za",
        },
        items: order.items.map((item) => ({
          description: item.product?.name || "Product",
          quantity: item.quantity,
          unitPrice: Number(item.price),
          total: Number(item.price) * item.quantity,
        })),
        subtotal,
        taxRate: taxRate * 100,
        tax,
        total,
        status: order.status,
      };
    }

    // Generate PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // Primary blue
    doc.text("INVOICE", 20, 30);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${invoiceData.date}`, 20, 46);
    doc.text(`Due Date: ${invoiceData.dueDate}`, 20, 52);

    // Provider info (right side)
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(invoiceData.provider.name, 200, 30, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(invoiceData.provider.address, 200, 36, { align: "right" });
    doc.text(invoiceData.provider.contact, 200, 42, { align: "right" });
    doc.text(invoiceData.provider.email, 200, 48, { align: "right" });

    // Customer info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("BILL TO:", 20, 70);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(invoiceData.customer.name, 20, 78);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(invoiceData.customer.email, 20, 84);
    if (invoiceData.customer.phone) {
      doc.text(invoiceData.customer.phone, 20, 90);
    }

    // Appointment details (if applicable)
    if (invoiceData.appointmentDate) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("APPOINTMENT:", 120, 70);
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text(`Date: ${invoiceData.appointmentDate}`, 120, 78);
      doc.text(`Time: ${invoiceData.appointmentTime}`, 120, 84);
      doc.text(`Status: ${invoiceData.status}`, 120, 90);
    }

    // Items table
    const tableData = invoiceData.items.map((item: any) => [
      item.description,
      item.quantity.toString(),
      `R ${item.unitPrice.toFixed(2)}`,
      `R ${item.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 105,
      head: [["Description", "Qty", "Unit Price", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
      },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.text("Subtotal:", 140, finalY);
    doc.text(`R ${invoiceData.subtotal.toFixed(2)}`, 200, finalY, { align: "right" });

    doc.text(`VAT (${invoiceData.taxRate}%):`, 140, finalY + 7);
    doc.text(`R ${invoiceData.tax.toFixed(2)}`, 200, finalY + 7, { align: "right" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 140, finalY + 16);
    doc.setTextColor(37, 99, 235);
    doc.text(`R ${invoiceData.total.toFixed(2)}`, 200, finalY + 16, { align: "right" });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business!", 105, 280, { align: "center" });
    doc.text("Mzansi Market - Connecting South Africa", 105, 285, { align: "center" });

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer");

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoiceData.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
