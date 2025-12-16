import { jsPDF } from "jspdf";
import { Order } from "@/types/order";
import { format } from "date-fns";

/**
 * Generates a PDF invoice for an order
 * @param order - The order to generate invoice for
 */
export function generateInvoice(order: Order): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor = "#D4AF37"; // Gold color matching brand
    const textColor = "#333333";
    const mutedColor = "#666666";

    // Header
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    doc.text("INVOICE", 20, 25);

    // Company Info
    doc.setFontSize(10);
    doc.setTextColor(textColor);
    doc.text("The Prestige Merchandise", 20, 35);
    doc.setTextColor(mutedColor);
    doc.text("Abossey Okai, Accra, Ghana", 20, 40);
    doc.text("Phone: +233 247 654 321", 20, 45);
    doc.text("Email: support@prestigemerch.com", 20, 50);

    // Invoice Details (right side)
    doc.setTextColor(textColor);
    doc.setFontSize(10);
    const invoiceDate = order.createdAt?.seconds
        ? format(new Date(order.createdAt.seconds * 1000), "MMMM d, yyyy")
        : format(new Date(), "MMMM d, yyyy");

    doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, pageWidth - 70, 25);
    doc.text(`Date: ${invoiceDate}`, pageWidth - 70, 32);
    doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, pageWidth - 70, 39);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 55, pageWidth - 20, 55);

    // Bill To Section
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text("Bill To:", 20, 65);

    doc.setFontSize(10);
    doc.setTextColor(textColor);
    doc.text(`${order.customerDetails.firstName} ${order.customerDetails.lastName}`, 20, 72);
    doc.setTextColor(mutedColor);
    doc.text(`Phone: ${order.customerDetails.phone}`, 20, 78);
    if (order.customerDetails.email) {
        doc.text(`Email: ${order.customerDetails.email}`, 20, 84);
    }
    if (order.customerDetails.address) {
        doc.text(`Address: ${order.customerDetails.address}`, 20, 90);
        doc.text(`${order.customerDetails.city || ""}, ${order.customerDetails.region || ""}`, 20, 96);
    }

    // Items Table Header
    const tableTop = 110;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, tableTop, pageWidth - 40, 10, "F");

    doc.setFontSize(9);
    doc.setTextColor(textColor);
    doc.text("Item", 25, tableTop + 7);
    doc.text("Qty", 120, tableTop + 7);
    doc.text("Price", 140, tableTop + 7);
    doc.text("Total", pageWidth - 35, tableTop + 7);

    // Items
    let yPosition = tableTop + 18;
    order.items.forEach((item, index) => {
        // Item name (with variant if any)
        const itemName = item.variant ? `${item.name} (${item.variant})` : item.name;
        const displayName = itemName.length > 45 ? itemName.substring(0, 42) + "..." : itemName;

        doc.setFontSize(9);
        doc.setTextColor(textColor);
        doc.text(displayName, 25, yPosition);
        doc.text(item.quantity.toString(), 125, yPosition);
        doc.text(`GH₵ ${item.price.toFixed(2)}`, 140, yPosition);
        doc.text(`GH₵ ${(item.price * item.quantity).toFixed(2)}`, pageWidth - 35, yPosition);

        yPosition += 8;

        // Add new page if needed
        if (yPosition > 260) {
            doc.addPage();
            yPosition = 20;
        }
    });

    // Divider before total
    yPosition += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(100, yPosition, pageWidth - 20, yPosition);

    // Total
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(textColor);
    doc.text("Total Amount:", 120, yPosition);
    doc.setTextColor(primaryColor);
    doc.text(`GH₵ ${order.amount.toFixed(2)}`, pageWidth - 35, yPosition);

    // Footer
    const footerY = 280;
    doc.setFontSize(8);
    doc.setTextColor(mutedColor);
    doc.text("Thank you for your purchase!", pageWidth / 2, footerY, { align: "center" });
    doc.text("For inquiries, contact us via WhatsApp: +233 247 654 321", pageWidth / 2, footerY + 5, { align: "center" });

    // Download the PDF
    const fileName = `Invoice_${order.id.slice(0, 8)}.pdf`;
    doc.save(fileName);
}

/**
 * Check if jspdf is available
 */
export function isInvoiceGenerationAvailable(): boolean {
    return true;
}
