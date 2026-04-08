import { useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationName: string;
  googlePlaceId: string;
}

export default function QrCodeModal({ open, onOpenChange, locationName, googlePlaceId }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const reviewUrl = `https://search.google.com/local/writereview?placeid=${googlePlaceId}`;

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=600,height=700");
    if (!win) return;

    // Grab the SVG element's outer HTML to embed in the print window
    const svgEl = canvasRef.current?.querySelector("svg");
    const svgHtml = svgEl ? svgEl.outerHTML : "";

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QR Code — ${locationName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #fff;
    }
    .card {
      text-align: center;
      padding: 40px;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      max-width: 340px;
      width: 100%;
    }
    .brand {
      font-size: 13px;
      font-weight: 600;
      color: #f97316;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    .qr { margin: 0 auto 20px; }
    svg { display: block; }
    .location {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    .tagline {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }
    @media print {
      body { min-height: auto; }
      .card { border-color: #d1d5db; }
    }
  </style>
</head>
<body>
  <div class="card">
    <p class="brand">Scan to review</p>
    <div class="qr">${svgHtml}</div>
    <p class="location">${locationName}</p>
    <p class="tagline">Share your experience on Google.<br>It takes less than 2 minutes.</p>
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`);
    win.document.close();
  };

  const handleDownload = () => {
    // Find the hidden canvas element and download it
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    // Draw a white background + the QR onto a new canvas with padding
    const size = canvas.width;
    const pad = 40;
    const out = document.createElement("canvas");
    out.width = size + pad * 2;
    out.height = size + pad * 2 + 80; // extra space for text
    const ctx = out.getContext("2d")!;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);

    // QR code
    ctx.drawImage(canvas, pad, pad);

    // Location name
    ctx.fillStyle = "#111827";
    ctx.font = `bold 18px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(locationName, out.width / 2, size + pad + 36);

    // Tagline
    ctx.fillStyle = "#6b7280";
    ctx.font = `13px -apple-system, sans-serif`;
    ctx.fillText("Scan to leave a review on Google", out.width / 2, size + pad + 58);

    const link = document.createElement("a");
    link.download = `${locationName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-qr-code.png`;
    link.href = out.toDataURL("image/png");
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Google Review QR Code</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-1">
          Print or download this QR code and display it at your location. Customers scan it to leave a Google review instantly.
        </p>

        {/* Visual card — what will be printed */}
        <div ref={canvasRef} className="flex flex-col items-center gap-4 py-6 px-4 border rounded-xl bg-white text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Scan to review</p>
          <QRCodeSVG
            value={reviewUrl}
            size={200}
            bgColor="#ffffff"
            fgColor="#111827"
            level="M"
          />
          <div>
            <p className="font-bold text-lg text-gray-900">{locationName}</p>
            <p className="text-sm text-muted-foreground mt-1">Share your experience on Google.<br />It takes less than 2 minutes.</p>
          </div>
          {/* Hidden canvas used for PNG download */}
          <div className="hidden">
            <QRCodeCanvas value={reviewUrl} size={400} bgColor="#ffffff" fgColor="#111827" level="M" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button className="flex-1 gap-2" onClick={handleDownload}>
            <Download className="w-4 h-4" /> Download PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
