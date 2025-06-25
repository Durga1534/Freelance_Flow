import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { Client, Storage, ID } from "appwrite";

// ✅ Use admin client with secret API key
const serverClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) 
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!) 
  .setKey(process.env.APPWRITE_API_KEY!);

const storage = new Storage(serverClient);

export async function POST(req: NextRequest) {
  try {
    const { invoice } = await req.json();

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 30px; }
            h1 { font-size: 24px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Invoice - ${invoice.invoice_number}</h1>
          <p><strong>Client:</strong> ${invoice.client_email}</p>
          <p><strong>Due Date:</strong> ${invoice.due_date}</p>
          <table>
            <thead>
              <tr><th>Description</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item: any) =>
                    `<tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>${item.rate}</td>
                      <td>${item.amount}</td>
                    </tr>`
                )
                .join("")}
              <tr>
                <td colspan="3"><strong>Total</strong></td>
                <td><strong>$${invoice.total_amount}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const file = new File([blob], `invoice-${invoice.invoice_number}.pdf`, { type: "application/pdf" });

    const uploaded = await storage.createFile(
      "685a364e002366134e25", // ✅ your bucket ID
      ID.unique(),
      file
    );

    const preview = storage.getFilePreview("user-invoices", uploaded.$id);

    return NextResponse.json({ success: true, previewUrl: preview.href });
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
