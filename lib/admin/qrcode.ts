import QRCode from "qrcode";

export async function generateQrCodeSvg(url: string): Promise<string> {
  const svg = await QRCode.toString(url, {
    type: "svg",
    color: {
      dark: "#2B2425",
      light: "#FFFFFF",
    },
    margin: 2,
  });
  // Ensure responsive width/height and viewBox
  return svg.replace(/<svg\s+([^>]*)width="[^"]*"\s+height="[^"]*"/i, '<svg $1 width="100%" height="100%"');
}

export async function generateQrCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    color: {
      dark: "#2B2425",
      light: "#FFFFFF",
    },
    margin: 2,
    width: 320,
  });
}
