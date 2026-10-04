import QRCode from "qrcode";

export async function generateQrCodeSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    color: {
      dark: "#2B2425",
      light: "#FFFFFF",
    },
    margin: 2,
    width: 280,
  });
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
