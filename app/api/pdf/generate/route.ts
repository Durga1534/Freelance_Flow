import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
    try {
        const { html } = await req.json();

        if(!html) {
            return NextResponse.json({message: "Missing HTML content."}, {status: 400});
        }

        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        await page.setContent(html, {waitUntil: "networkidle0"});

        const pdfBuffer = await page.pdf({format: "A4"});
        await browser.close();

        return new Response(pdfBuffer, {
            headers: {
                "Content-type": "application/pdf",
                "Content-Disposition": "attachment; filename=invoice.pdf",
            },
        });
    }catch(err) {
        console.error("PDF Generation error: ", err);
        return NextResponse.json({error: "Failed to generate PDF "}, {status: 500})
    }
}