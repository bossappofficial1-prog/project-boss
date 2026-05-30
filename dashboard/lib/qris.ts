/**
 * CRC16-CCITT Checksum generator for EMVCo / QRIS
 */
export function crc16ccitt(data: string): string {
  let crc = 0xffff;
  for (let c = 0; c < data.length; c++) {
    const code = data.charCodeAt(c);
    crc ^= code << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  let hex = crc.toString(16).toUpperCase();
  return hex.padStart(4, "0");
}

/**
 * Parses an EMVCo QRIS string into Tag-Length-Value (TLV) maps.
 */
export function parseEMVCo(qris: string): Map<string, string> {
  const tags = new Map<string, string>();
  let i = 0;
  while (i < qris.length) {
    if (i + 4 > qris.length) break;
    const tag = qris.slice(i, i + 2);
    const lengthVal = qris.slice(i + 2, i + 4);
    const length = parseInt(lengthVal, 10);
    if (isNaN(length)) break;
    if (i + 4 + length > qris.length) break;
    const value = qris.slice(i + 4, i + 4 + length);
    tags.set(tag, value);
    i += 4 + length;
  }
  return tags;
}

/**
 * Generates a dynamic QRIS EMVCo string from a static QRIS string by injecting the nominal amount.
 */
export function generateDynamicQRIS(staticQris: string, amount: number, transactionId?: string): string {
  try {
    if (!staticQris || !staticQris.startsWith("000201")) {
      return staticQris; // Fallback if string is invalid
    }

    const tags = parseEMVCo(staticQris);

    // 1. Set Point of Initiation Method to '12' (Dynamic QR)
    tags.set("01", "12");

    // 2. Set Transaction Amount (Tag 54)
    const amountStr = Math.round(amount).toString();
    tags.set("54", amountStr);

    // 3. Ensure Transaction Currency is IDR (Tag 53 = "360")
    if (!tags.has("53")) {
      tags.set("53", "360");
    }

    // 4. Remove Tag 63 (CRC) so we can recalculate it
    tags.delete("63");

    // 5. Set Transaction ID / Bill Number under Additional Data (Tag 62)
    if (transactionId) {
      const billLength = transactionId.length.toString().padStart(2, "0");
      const tag62Value = `01${billLength}${transactionId}`;
      tags.set("62", tag62Value);
    }

    // 6. Reconstruct the string (sorted by Tag keys for strict EMVCo compliance)
    let result = "";
    const sortedTags = Array.from(tags.keys()).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    for (const tag of sortedTags) {
      const val = tags.get(tag)!;
      const len = val.length.toString().padStart(2, "0");
      result += `${tag}${len}${val}`;
    }

    // 7. Append Tag 63 with length 04 and calculate CRC16
    result += "6304";
    const crc = crc16ccitt(result);
    result += crc;

    return result;
  } catch (error) {
    console.error("[Dynamic QRIS] Failed to generate dynamic QRIS:", error);
    return staticQris; // Fallback
  }
}

/**
 * Generates a Google Charts QR Code Image URL from a QRIS string.
 */
export function getQrisQrCodeUrl(qrisString: string): string {
  return `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(qrisString)}`;
}
