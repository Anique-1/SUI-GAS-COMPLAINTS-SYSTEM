import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import querystring from 'querystring';

export const dynamic = 'force-dynamic';

function mergeCookies(existing: string[], incoming: string[]): string {
  const cookieMap = new Map<string, string>();
  for (const c of [...existing, ...incoming]) {
    const pair = c.split(';')[0];
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const name = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      cookieMap.set(name, val);
    }
  }
  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function fetchSngplSessionAndCaptcha(): Promise<{
  captchaDataUrl: string;
  sessionId: string;
  as_sfid?: string;
  as_fid?: string;
}> {
  return new Promise((resolve, reject) => {
    const sessionReq = https.request(
      'https://www.sngpl.com.pk/login.jsp?mdids=85',
      {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
      },
      (sessionRes) => {
        let loginHtml = '';
        sessionRes.on('data', (d) => (loginHtml += d));

        sessionRes.on('end', () => {
          const setCookies1 = sessionRes.headers['set-cookie'] || [];
          const cookieHeader1 = setCookies1.map((c) => c.split(';')[0]).join('; ');

          // Extract Citrix NetScaler anti-CSRF tokens
          const sfidMatch = loginHtml.match(/name="as_sfid"\s*value="([^"]+)"/i);
          const fidMatch = loginHtml.match(/name="as_fid"\s*value="([^"]+)"/i);
          const as_sfid = sfidMatch ? sfidMatch[1] : '';
          const as_fid = fidMatch ? fidMatch[1] : '';

          // Next fetch the captcha image with the session cookie
          const captchaReq = https.request(
            `https://www.sngpl.com.pk/captcha-image.jpg?rand=${Date.now()}`,
            {
              method: 'GET',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Cookie: cookieHeader1,
                Referer: 'https://www.sngpl.com.pk/login.jsp?mdids=85',
              },
            },
            (captchaRes) => {
              const setCookies2 = captchaRes.headers['set-cookie'] || [];
              const mergedCookieHeader = mergeCookies(setCookies1, setCookies2);

              const chunks: Buffer[] = [];
              captchaRes.on('data', (d) => chunks.push(d));
              captchaRes.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const base64 = buffer.toString('base64');
                const mime = captchaRes.headers['content-type'] || 'image/jpeg';
                const captchaDataUrl = `data:${mime};base64,${base64}`;

                const sessionObject = {
                  cookie: mergedCookieHeader,
                  as_sfid,
                  as_fid,
                };
                const encodedSession = Buffer.from(JSON.stringify(sessionObject)).toString(
                  'base64'
                );

                resolve({
                  captchaDataUrl,
                  sessionId: encodedSession,
                  as_sfid,
                  as_fid,
                });
              });
            }
          );

          captchaReq.on('error', reject);
          captchaReq.end();
        });
      }
    );

    sessionReq.on('error', reject);
    sessionReq.end();
  });
}

function submitSngplBillQuery(
  consumer: string,
  captcha: string,
  sessionId: string,
  contype: string = 'NewCon'
): Promise<string> {
  return new Promise((resolve, reject) => {
    let rawCookie = '';
    let as_sfid = '';
    let as_fid = '';

    try {
      const parsed = JSON.parse(Buffer.from(sessionId, 'base64').toString('utf-8'));
      rawCookie = parsed.cookie || '';
      as_sfid = parsed.as_sfid || '';
      as_fid = parsed.as_fid || '';
    } catch {
      rawCookie = Buffer.from(sessionId, 'base64').toString('utf-8');
    }

    const postParams: Record<string, string> = {
      proc: 'viewbill',
      consumer: consumer,
      contype: contype,
      txtCaptcha: captcha,
      mdids: '85',
    };
    if (as_sfid) postParams.as_sfid = as_sfid;
    if (as_fid) postParams.as_fid = as_fid;

    const postData = querystring.stringify(postParams);

    const makeRequest = (urlStr: string, method: string, data?: string, redirectCount = 0) => {
      if (redirectCount > 3) {
        return reject(new Error('Too many redirects from SNGPL server.'));
      }

      const parsedUrl = new URL(urlStr, 'https://www.sngpl.com.pk');
      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Cookie: rawCookie,
          Referer: 'https://www.sngpl.com.pk/login.jsp?mdids=85',
          Origin: 'https://www.sngpl.com.pk',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
      };

      if (method === 'POST' && data) {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data),
        };
      }

      const req = https.request(options, (res) => {
        // Merge any new cookies set on redirect/response
        if (res.headers['set-cookie']) {
          rawCookie = mergeCookies(
            rawCookie ? rawCookie.split('; ') : [],
            res.headers['set-cookie']
          );
        }

        // Follow HTTP redirects (301, 302, 303, 307)
        if (
          (res.statusCode === 301 ||
            res.statusCode === 302 ||
            res.statusCode === 303 ||
            res.statusCode === 307) &&
          res.headers.location
        ) {
          const redirectUrl = new URL(res.headers.location, 'https://www.sngpl.com.pk').toString();
          return makeRequest(redirectUrl, 'GET', undefined, redirectCount + 1);
        }

        const chunks: Buffer[] = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8');
          resolve(body);
        });
      });

      req.on('error', reject);
      if (method === 'POST' && data) {
        req.write(data);
      }
      req.end();
    };

    makeRequest('https://www.sngpl.com.pk/viewbill', 'POST', postData);
  });
}

function cleanHtmlText(str: string): string {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function findTableValue(html: string, labels: string[]): string | null {
  for (const label of labels) {
    // Pattern 1: <td>Label</td><td...>Value</td>
    const regex1 = new RegExp(
      `(?:<td|<th)[^>]*>(?:<[^>]+>)*\\s*${label}\\s*[:=-]?(?:<[^>]+>)*\\s*<\\/(?:td|th)>\\s*<(?:td|th)[^>]*>([\\s\\S]*?)<\\/(?:td|th)>`,
      'i'
    );
    const m1 = html.match(regex1);
    if (m1 && cleanHtmlText(m1[1])) {
      return cleanHtmlText(m1[1]);
    }

    // Pattern 2: Label : Value in text
    const regex2 = new RegExp(
      `${label}\\s*[:=-]\\s*([^<\\n\\r]+?)(?=<|\\n|\\r|$)`,
      'i'
    );
    const m2 = html.match(regex2);
    if (m2 && cleanHtmlText(m2[1])) {
      return cleanHtmlText(m2[1]);
    }
  }
  return null;
}

function sanitizeAndFixSngplHtml(html: string): string {
  let cleaned = html;

  // 1. Defuse frame-busting scripts
  cleaned = cleaned.replace(/top\.location/gi, '/*top.location*/');
  cleaned = cleaned.replace(/parent\.location/gi, '/*parent.location*/');
  cleaned = cleaned.replace(/window\.top/gi, '/*window.top*/');

  // 2. Base tag and embedded styling
  const baseTag = '<base href="https://www.sngpl.com.pk/" target="_blank">';
  const injectedStyles = `
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0 !important; padding: 0 !important; background: #ffffff; }
      /* Scale the bill to fit the iframe width */
      body { zoom: 1; }
      img { max-width: 100%; }
      /* Remove frame-busting redirects */
      @media print {
        .no-print, .no-print * { display: none !important; }
      }
    </style>
  `;

  if (/<head[^>]*>/i.test(cleaned)) {
    cleaned = cleaned.replace(/<head[^>]*>/i, `$& \n ${baseTag} \n ${injectedStyles}`);
  } else {
    cleaned = `<!DOCTYPE html><html><head>${baseTag}${injectedStyles}</head><body>${cleaned}</body></html>`;
  }

  // 3. Rewrite relative src, href, and background URLs to absolute SNGPL domain
  cleaned = cleaned.replace(/src="\/([^"]*)"/gi, 'src="https://www.sngpl.com.pk/$1"');
  cleaned = cleaned.replace(/src='\/([^']*)'/gi, "src='https://www.sngpl.com.pk/$1'");
  cleaned = cleaned.replace(
    /src="(?!https?:\/\/|data:|\/\/)([^"]*)"/gi,
    'src="https://www.sngpl.com.pk/$1"'
  );
  cleaned = cleaned.replace(
    /src='(?!https?:\/\/|data:|\/\/)([^']*)'/gi,
    "src='https://www.sngpl.com.pk/$1'"
  );

  cleaned = cleaned.replace(/href="\/([^"]*)"/gi, 'href="https://www.sngpl.com.pk/$1"');
  cleaned = cleaned.replace(/href='\/([^']*)'/gi, "href='https://www.sngpl.com.pk/$1'");
  cleaned = cleaned.replace(
    /href="(?!https?:\/\/|mailto:|tel:|#|javascript:|\/\/)([^"]*)"/gi,
    'href="https://www.sngpl.com.pk/$1"'
  );

  cleaned = cleaned.replace(
    /background="\/([^"]*)"/gi,
    'background="https://www.sngpl.com.pk/$1"'
  );
  cleaned = cleaned.replace(
    /background="(?!https?:\/\/|data:|\/\/)([^"]*)"/gi,
    'background="https://www.sngpl.com.pk/$1"'
  );

  return cleaned;
}

function isValidDate(str: string | null | undefined): boolean {
  if (!str) return false;
  const t = str.trim();
  if (t === '->' || t === '-->' || t.startsWith('-') || t === '—' || t.length < 6) return false;
  return /^\d{1,2}[-\/\.](?:[A-Za-z]{3,9}|\d{1,2})[-\/\.]\d{2,4}$/.test(t);
}

function parseDateToTime(dStr: string | null | undefined): number {
  if (!dStr) return 0;
  const parts = dStr.split(/[-\/\.]/);
  if (parts.length !== 3) return 0;
  const day = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (isNaN(month)) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    month = months.indexOf(parts[1].toLowerCase().slice(0, 3)) + 1;
  }
  if (year < 100) year += 2000;
  return new Date(year, month - 1, day).getTime() || 0;
}

function parseSngplBillHtml(rawHtml: string, fallbackConsumer: string) {
  // 1. Strip HTML comments to prevent stray arrows and comment markers from polluting values
  const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '');
  const cleanFullText = cleanHtmlText(html);

  // 2. Extract structured table rows and cells
  const rows: string[][] = [];
  const trMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const tr of trMatches) {
    const tdMatches = [...tr[1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)];
    const cells = tdMatches.map((td) => cleanHtmlText(td[1])).filter(Boolean);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  // Helper to find a numeric or monetary value in a row containing specific labels
  const findValueInRow = (keywords: string[]): string | null => {
    for (const cells of rows) {
      const rowStr = cells.join(' ').toLowerCase();
      const matchesKeyword = keywords.some((k) => rowStr.includes(k.toLowerCase()));
      if (matchesKeyword) {
        // Search backwards for the numeric cell to skip English and Urdu labels
        for (let i = cells.length - 1; i >= 0; i--) {
          const c = cells[i];
          if (/^-?[\d,]+(?:\.\d{1,2})?$/.test(c.replace(/\s/g, ''))) {
            return c;
          }
        }
        if (cells.length > 1) {
          const lastCell = cells[cells.length - 1];
          // Ensure it's not another label
          if (!keywords.some((k) => lastCell.toLowerCase().includes(k.toLowerCase()))) {
            return lastCell;
          }
        }
      }
    }
    return null;
  };

  // Helper to find value by regex on clean plain text
  const findValueInText = (labels: string[]): string | null => {
    for (const label of labels) {
      const re = new RegExp(`${label}\\s*[:=]\\s*([^\\n\\r|;]+?)(?=\\s{2,}|\\n|\\r|$|Tariff|Meter|Consumer|Bill|Address)`, 'i');
      const m = cleanFullText.match(re);
      if (m && m[1] && m[1].trim() !== '->' && m[1].trim() !== '-->') {
        return cleanHtmlText(m[1]);
      }
    }
    return null;
  };

  // 1. Consumer No
  let consumerNo: string | null = null;
  for (const cells of rows) {
    const rowStr = cells.join(' ').toLowerCase();
    if (rowStr.includes('consumer') || rowStr.includes('account id') || rowStr.includes('account no')) {
      for (const c of cells) {
        const m = c.match(/\b(\d{10,11})\b/);
        if (m) {
          consumerNo = m[1];
          break;
        }
      }
    }
    if (consumerNo) break;
  }
  if (!consumerNo) {
    const m = html.match(/\b(\d{10,11})\b/);
    if (m) consumerNo = m[1];
  }
  consumerNo = consumerNo || fallbackConsumer;

  // 2. Consumer Name
  let consumerName: string | null = null;
  for (const cells of rows) {
    if (cells.some((c) => /^\s*Name\s*:?\s*$/i.test(c))) {
      // In SNGPL bill, cell format is [Name:, Urdu Name, Consumer Name]
      consumerName = cells[cells.length - 1];
      break;
    }
  }
  if (!consumerName) {
    const m = html.match(/Name[:\s]+(?:<[^>]+>)*\s*([A-Za-z\s\.\/]{4,50})(?=<|\n|\r|Address)/i);
    if (m) consumerName = cleanHtmlText(m[1]);
  }
  if (consumerName) {
    consumerName = consumerName.replace(/^[:\s-]+/, '').trim();
  }
  consumerName = consumerName && consumerName.length > 3 ? consumerName : 'SNGPL Registered Consumer';

  // 3. Address
  let address: string | null = null;
  for (const cells of rows) {
    if (cells.some((c) => /^\s*Address\s*:?\s*$/i.test(c))) {
      address = cells[cells.length - 1];
      break;
    }
  }
  if (!address) {
    const m = html.match(/Address[:\s]+(?:<[^>]+>)*\s*([^<\n\r]{6,120})/i);
    if (m) address = cleanHtmlText(m[1]);
  }
  if (address) {
    address = address.replace(/^[:\s-]+/, '').trim();
  }
  address = address && address.length > 4 ? address : 'Consumer Registered Connection Address';

  // 4. Meter No
  let meterNo: string | null = null;
  for (const cells of rows) {
    for (const c of cells) {
      if (/^[A-Z]{1,3}\d{6,14}$/i.test(c.trim())) {
        meterNo = c.trim();
        break;
      }
    }
    if (meterNo) break;
  }
  if (!meterNo) {
    const m = html.match(/Meter\s*(?:No|Number)?\.?\s*[:\s]*([A-Za-z0-9-]+)/i);
    if (m && m[1].length > 4) meterNo = m[1].trim();
  }
  meterNo = meterNo || 'Verified SNGPL Meter';

  // 5. Billing Month
  let billingMonth: string | null = null;
  for (const cells of rows) {
    for (const c of cells) {
      const m = c.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i);
      if (m) {
        billingMonth = m[0];
        break;
      }
    }
    if (billingMonth) break;
  }
  if (!billingMonth) {
    const m = cleanFullText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i);
    if (m) billingMonth = m[0];
  }
  billingMonth = billingMonth || 'Current Billing Cycle';

  // 6. Issue Date
  let issueDate: string | null = null;
  const issueDateMatch = html.match(/Issue\s*Date\s*[:\s]*(\d{1,2}[-\/\.][A-Za-z0-9]{2,4}[-\/\.]\d{2,4})/i);
  if (issueDateMatch && isValidDate(issueDateMatch[1])) {
    issueDate = issueDateMatch[1];
  } else {
    for (const cells of rows) {
      const rowStr = cells.join(' ');
      const m = rowStr.match(/Issue\s*Date\s*[:\s]*(\d{1,2}[-\/\.][A-Za-z0-9]{2,4}[-\/\.]\d{2,4})/i);
      if (m && isValidDate(m[1])) {
        issueDate = m[1];
        break;
      }
    }
  }
  issueDate = issueDate || 'Latest Cycle';
  const issueTime = parseDateToTime(issueDate);

  // 7. Due Date
  let dueDate: string | null = null;

  // A. Check explicit "Due Date: <date>"
  const explicitDue = html.match(/Due\s*Date\s*[:\s]*(\d{1,2}[-\/\.][A-Za-z0-9]{2,4}[-\/\.]\d{2,4})/i);
  if (explicitDue && isValidDate(explicitDue[1])) {
    dueDate = explicitDue[1];
  }

  // B. Check Payment Slip row: typically 3 cells: [amountWithin, amountAfter, dueDate]
  if (!dueDate) {
    for (const cells of rows) {
      const rowStr = cells.join(' ').toLowerCase();
      // Exclude meter reading dates row (which has 'Dates:', 'Reading:', etc.)
      if (rowStr.includes('dates:') || rowStr.includes('reading:') || rowStr.includes('difference')) {
        continue;
      }
      if (cells.length >= 3) {
        const lastCell = cells[cells.length - 1];
        if (isValidDate(lastCell) && lastCell !== issueDate) {
          const t = parseDateToTime(lastCell);
          if (issueTime === 0 || t >= issueTime) {
            dueDate = lastCell;
            break;
          }
        }
      }
    }
  }

  // C. Find all candidate dates in the document
  if (!dueDate) {
    const candidateDates: string[] = [];
    for (const cells of rows) {
      const rowStr = cells.join(' ').toLowerCase();
      if (rowStr.includes('dates:') || rowStr.includes('reading:') || rowStr.includes('difference')) {
        continue;
      }
      for (const c of cells) {
        if (isValidDate(c) && !candidateDates.includes(c)) {
          candidateDates.push(c);
        }
      }
    }
    // Filter out issueDate and previous years
    const nonIssueDates = candidateDates.filter((d) => d !== issueDate && !d.includes('2024') && !d.includes('2025'));
    // Filter dates on or after issueDate
    const afterIssueDates = nonIssueDates.filter((d) => {
      const t = parseDateToTime(d);
      return issueTime === 0 || t >= issueTime;
    });

    if (afterIssueDates.length > 0) {
      afterIssueDates.sort((a, b) => parseDateToTime(b) - parseDateToTime(a));
      dueDate = afterIssueDates[0];
    } else if (nonIssueDates.length > 0) {
      nonIssueDates.sort((a, b) => parseDateToTime(b) - parseDateToTime(a));
      dueDate = nonIssueDates[0];
    }
  }

  // D. Fallback check from barcode text (DDMMYY)
  if (!dueDate) {
    const barcodeMatch = html.match(/([0-9]{45,60})/);
    if (barcodeMatch) {
      const bStr = barcodeMatch[1];
      const dateSub = bStr.match(/(\d{2})(\d{2})(\d{2})(?=\d{10,})/);
      if (dateSub) {
        const d = dateSub[1];
        const m = dateSub[2];
        const y = '20' + dateSub[3];
        if (parseInt(d) <= 31 && parseInt(m) <= 12) {
          dueDate = `${d}-${m}-${y}`;
        }
      }
    }
  }

  dueDate = (dueDate && isValidDate(dueDate)) ? dueDate : 'Refer to Bill Document';

  // 8. Tariff
  let category: string | null = null;
  const tariffMatch = html.match(/Tariff\s*[:\s]+([A-Za-z0-9\s\(\)-]+?)(?=\s*Issue|\s*Date|\s*<|\s*\n)/i);
  if (tariffMatch) {
    category = cleanHtmlText(tariffMatch[1]);
  }
  if (!category) {
    category = findValueInText(['Tariff', 'Category', 'Connection Category']) || 'Domestic (Standard / Protected)';
  }

  // 9. Readings
  let currReading = '—';
  let prevReading = '—';
  for (const cells of rows) {
    const rowStr = cells.join(' ').toLowerCase();
    if (rowStr.includes('reading:') || rowStr.includes('reading')) {
      const nums = cells.filter((c) => /^\d{5,10}$/.test(c.trim()));
      if (nums.length >= 2) {
        currReading = nums[0];
        prevReading = nums[1];
      }
    }
  }

  // 10. Gas Consumed HM3 & MMBTU
  const gasConsumedHm3 = findValueInRow(['Gas Consumed HM3', 'Gas Consumed', 'Volume']) || findValueInText(['Gas Consumed', 'HM3']) || '—';
  const mmbtu = findValueInRow(['*MMBTU', 'MMBTU']) || findValueInText(['MMBTU']) || '—';

  // 11. Breakdown Charges
  const gasCharges = findValueInRow(['Gas Charges']) || findValueInText(['Gas Charges']) || '—';
  const meterRent = findValueInRow(['Meter Rent']) || findValueInText(['Meter Rent']) || '—';
  const fixedCharges = findValueInRow(['Fixed Charges']) || findValueInText(['Fixed Charges']) || '—';
  const gst = findValueInRow(['GST', 'General Sales Tax', 'Sales Tax']) || findValueInText(['GST', 'Sales Tax']) || '—';
  const provAdj = findValueInRow(['Prov.Bill Adjustment', 'Bill Adjustment']) || '0.00';
  const currentBill = findValueInRow(['Current Bill']) || findValueInText(['Current Bill']) || '—';
  const lateSurcharge = findValueInRow(['Late Payment Surcharge', 'L.P.S', 'Surcharge']) || findValueInText(['Late Payment Surcharge', 'L.P.S']) || '—';

  // 12. Totals
  let totalWithinDue = findValueInRow(['Total Amount Due', 'Total Payable Within Due Date', 'Payable Within Due Date']) || findValueInText(['Payable Within Due Date', 'Total Amount Due']);
  let totalAfterDue = findValueInRow(['Payable After Due Date', 'Total Payable After Due Date', 'Gross Amount Payable']) || findValueInText(['Payable After Due Date']);

  // Payment slip row fallback: [totalWithin, totalAfter, dueDate]
  if (!totalWithinDue || totalWithinDue === '—' || !totalAfterDue || totalAfterDue === '—') {
    for (const cells of rows) {
      if (cells.length >= 3 && isValidDate(cells[cells.length - 1])) {
        if (/^-?[\d,]+(?:\.\d{1,2})?$/.test(cells[0].replace(/\s/g, ''))) {
          totalWithinDue = cells[0];
        }
        if (/^-?[\d,]+(?:\.\d{1,2})?$/.test(cells[1].replace(/\s/g, ''))) {
          totalAfterDue = cells[1];
        }
      }
    }
  }

  return {
    consumerNo,
    consumerName,
    meterNo,
    category,
    billingMonth,
    issueDate,
    dueDate,
    address,
    region: 'SNGPL Regional Transmission & Distribution Network',
    prevReading,
    currReading,
    gasConsumedHm3,
    mmbtu,
    gasCharges,
    meterRent,
    fixedCharges,
    gst,
    provAdj,
    currentBill,
    lateSurcharge: lateSurcharge || '—',
    totalWithinDue: totalWithinDue || '—',
    totalAfterDue: totalAfterDue || '—',
    rawHtml: rawHtml,
  };
}


export async function GET() {
  try {
    const sessionData = await fetchSngplSessionAndCaptcha();
    return NextResponse.json({
      success: true,
      captchaDataUrl: sessionData.captchaDataUrl,
      sessionId: sessionData.sessionId,
      as_sfid: sessionData.as_sfid,
      as_fid: sessionData.as_fid,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Unable to establish live connection to SNGPL Billing Server. Please verify internet connectivity.',
        details: error?.message,
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const consumer = (body.consumer || '').replace(/\D/g, '');
    const captcha = (body.captcha || '').trim();
    const sessionId = (body.sessionId || '').trim();
    const contype = body.contype === 'OldCon' ? 'OldCon' : 'NewCon';

    if (!consumer || consumer.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid 10 or 11-digit SNGPL Consumer Number.',
        code: 'INVALID_INPUT',
      });
    }

    if (!captcha) {
      return NextResponse.json({
        success: false,
        error: 'Please enter the Captcha code shown in the security image.',
        code: 'MISSING_CAPTCHA',
      });
    }

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session expired. Please click Refresh Captcha and try again.',
        code: 'SESSION_EXPIRED',
      });
    }

    // Submit live bill request to SNGPL server
    const sngplResponseHtml = await submitSngplBillQuery(
      consumer,
      captcha,
      sessionId,
      contype
    );

    const trimmed = sngplResponseHtml.trim();

    if (
      trimmed === 'Invalid Captcha' ||
      trimmed.includes('Invalid Captcha')
    ) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Captcha code entered. Please type the characters shown in the security image.',
        code: 'INVALID_CAPTCHA',
      });
    }

    if (
      trimmed === 'Bill is not available for this consumer.' ||
      trimmed.includes('Bill is not available for this consumer') ||
      trimmed === ''
    ) {
      return NextResponse.json({
        success: false,
        error: `Bill is not available on official SNGPL portal for Consumer Number ${consumer}. Please verify the 11-digit number printed on your bill.`,
        code: 'BILL_NOT_FOUND',
      });
    }

    if (
      trimmed === 'Incorrect Consumer Number' ||
      trimmed.includes('Incorrect Consumer Number')
    ) {
      return NextResponse.json({
        success: false,
        error: `Incorrect Consumer Number (${consumer}). SNGPL portal could not locate this account.`,
        code: 'INCORRECT_CONSUMER',
      });
    }

    if (trimmed.includes('Login required to view bill')) {
      return NextResponse.json({
        success: false,
        error:
          'SNGPL portal requires authentication for this consumer category. Please check your regional customer care.',
        code: 'AUTH_REQUIRED',
      });
    }

    // Check if the response actually contains bill content or redirected back to login
    const hasBillIndicators =
      sngplResponseHtml.includes('Consumer') ||
      sngplResponseHtml.includes('Due Date') ||
      sngplResponseHtml.includes('Payable') ||
      sngplResponseHtml.includes('Meter') ||
      sngplResponseHtml.includes('Tariff') ||
      sngplResponseHtml.includes('Billing Month');

    if (!hasBillIndicators && sngplResponseHtml.includes('txtCaptcha')) {
      return NextResponse.json({
        success: false,
        error:
          'Security Captcha verification failed or expired. Please refresh the Captcha and try again.',
        code: 'CAPTCHA_VERIFICATION_FAILED',
      });
    }

    // Sanitize and resolve asset URLs in raw HTML
    const sanitizedHtml = sanitizeAndFixSngplHtml(sngplResponseHtml);

    // Parse the official SNGPL Bill HTML fields
    const parsedBill = parseSngplBillHtml(sngplResponseHtml, consumer);

    return NextResponse.json({
      success: true,
      bill: parsedBill,
      rawHtml: sanitizedHtml,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error:
        'Error connecting to official SNGPL Billing Gateway. Please retry in a moment.',
      details: error?.message,
    });
  }
}
