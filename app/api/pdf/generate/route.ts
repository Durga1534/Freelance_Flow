import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
    try {
        const { html } = await req.json();

        if (!html) {
            return NextResponse.json({ message: "Missing HTML content." }, { status: 400 });
        }

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({ format: "A4" });
        await browser.close();

        // Fix: convert Uint8Array → Buffer explicitly
        const buffer = Buffer.from(pdfBuffer);

        return new Response(buffer, {
            headers: {
                "Content-Type": "application/pdf",  // fixed: "type" → "Type"
                "Content-Disposition": "attachment; filename=invoice.pdf",
            },
        });
    } catch (err) {
        console.error("PDF Generation error: ", err);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}