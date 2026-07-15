import sharp from 'sharp';
import { GOOGLE_FAVICON_BASE, type LogoResult } from './types';

const COMPANYENRICH_BASE = 'https://api.companyenrich.com/logo';

export async function downloadLogo(
  websiteUrl: string,
  fallbackLogoUrl?: string
): Promise<LogoResult | null> {
  console.log(`Attempting to fetch logo for: ${websiteUrl}`);
  const domain = cleanDomainName(websiteUrl);

  // Stage 1: Try CompanyEnrich (high-res PNG, no API key needed)
  let buffer = await fetchFromCompanyEnrich(domain);

  // Stage 2: Fallback to Google Favicon
  if (!buffer) {
    console.log(`CompanyEnrich failed for ${domain}, trying Google Favicon`);
    buffer = await fetchFromGoogleFavicon(domain);
  }

  // Stage 3: Fallback to manual logo_url if provided
  if (!buffer && fallbackLogoUrl) {
    console.log(`Google Favicon failed for ${domain}, trying fallback URL: ${fallbackLogoUrl}`);
    buffer = await fetchFromUrl(fallbackLogoUrl);
  }

  if (!buffer || buffer.byteLength === 0) {
    console.log(`No logo found for ${websiteUrl}`);
    return null;
  }

  // Stage 4: Convert to WebP
  const webpResult = await convertToWebP(buffer);
  if (!webpResult) {
    console.log(`WebP conversion failed for ${domain}, using original buffer`);
    // If conversion fails, return as PNG
    return {
      buffer: Buffer.from(buffer),
      mimeType: 'image/png',
      originalFormat: 'unknown',
    };
  }

  console.log(`Logo ready for ${domain}: ${webpResult.mimeType} (${webpResult.buffer.byteLength} bytes, was ${webpResult.originalFormat})`);
  return webpResult;
}

async function fetchFromCompanyEnrich(domain: string): Promise<ArrayBuffer | null> {
  try {
    const url = `${COMPANYENRICH_BASE}/${domain}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'image/png,image/*' },
    });

    if (!response.ok) {
      console.log(`CompanyEnrich failed for ${domain}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      console.log(`CompanyEnrich returned non-image for ${domain}: ${contentType}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      console.log(`CompanyEnrich returned empty buffer for ${domain}`);
      return null;
    }

    console.log(`CompanyEnrich succeeded for ${domain}: ${buffer.byteLength} bytes`);
    return buffer;
  } catch (error) {
    console.log(`CompanyEnrich error for ${domain}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function fetchFromGoogleFavicon(domain: string): Promise<ArrayBuffer | null> {
  try {
    const url = `${GOOGLE_FAVICON_BASE}http://${domain}&size=256`;
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`Google Favicon failed for ${domain}: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      console.log(`Google Favicon returned empty buffer for ${domain}`);
      return null;
    }

    console.log(`Google Favicon succeeded for ${domain}: ${buffer.byteLength} bytes`);
    return buffer;
  } catch (error) {
    console.log(`Google Favicon error for ${domain}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function fetchFromUrl(logoUrl: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) {
      console.log(`Logo URL failed for ${logoUrl}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      console.log(`Logo URL not an image for ${logoUrl}: ${contentType}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    console.log(`Logo URL succeeded for ${logoUrl}: ${buffer.byteLength} bytes`);
    return buffer;
  } catch (error) {
    console.log(`Logo URL error for ${logoUrl}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function convertToWebP(inputBuffer: ArrayBuffer): Promise<LogoResult | null> {
  try {
    const buffer = Buffer.from(inputBuffer);
    const metadata = await sharp(buffer).metadata();
    const originalFormat = metadata.format || 'unknown';

    // If already WebP, no conversion needed
    if (originalFormat === 'webp') {
      return {
        buffer,
        mimeType: 'image/webp',
        originalFormat: 'webp',
      };
    }

    // Convert to WebP
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    return {
      buffer: webpBuffer,
      mimeType: 'image/webp',
      originalFormat,
    };
  } catch (error) {
    console.log(`WebP conversion error:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export function cleanDomainName(url: string): string {
  let domain = url.trim();

  try {
    const urlObj = new URL(domain);
    domain = urlObj.hostname;
  } catch {
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  return domain.toLowerCase();
}

export function getLogoFilename(domain: string): string {
  const clean = cleanDomainName(domain);
  const timestamp = Date.now();
  return `${clean}-${timestamp}.webp`;
}
