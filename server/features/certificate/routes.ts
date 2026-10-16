import type { Express, RequestHandler } from "express";
import path from "path";
import fs from "fs";

export function registerCertificateRoutes(app: Express, requireAuth: RequestHandler) {
  // === Certificate Generation ===

  app.post('/api/generate-certificate', requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "name is required and must be a non-empty string" });
      }

      const safeName = name.replace(/[^a-zA-Z0-9 ]/g, '');
      if (safeName.trim().length === 0) {
        return res.status(400).json({ message: "name must contain at least one alphanumeric character" });
      }

      const { PDFDocument, rgb } = await import('pdf-lib');
      const fontkit = (await import('@pdf-lib/fontkit')).default;

      const certDir = path.join(process.cwd(), 'server', 'assets', 'certificate');
      const bgBytes = fs.readFileSync(path.join(certDir, 'certificate-bg.png'));
      const fontBytes = fs.readFileSync(path.join(certDir, 'custom-font.otf'));

      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const bgImage = await pdfDoc.embedPng(bgBytes);
      const { width, height } = bgImage.scale(1);

      const page = pdfDoc.addPage([width, height]);
      page.drawImage(bgImage, { x: 0, y: 0, width, height });

      const font = await pdfDoc.embedFont(fontBytes);

      // Scale font proportionally to the certificate height, then shrink to fit within 60% of width
      const maxFontSize = Math.round(height * 0.052);
      const minFontSize = Math.round(height * 0.025);
      let fontSize = maxFontSize;
      while (fontSize > minFontSize && font.widthOfTextAtSize(safeName, fontSize) > width * 0.60) {
        fontSize -= 1;
      }

      const textWidth = font.widthOfTextAtSize(safeName, fontSize);
      const x = (width - textWidth) / 2;
      // Name sits in the blank space — roughly 59% from top = 41% from bottom
      const y = height * 0.41;

      page.drawText(safeName, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(1, 1, 1),
      });

      const pdfBytes = await pdfDoc.save();
      const buffer = Buffer.from(pdfBytes);

      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `attachment; filename="certificate-${safeName}.pdf"`);
      res.send(buffer);
    } catch (error) {
      console.error("Certificate generation error:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
    }
  });
}
