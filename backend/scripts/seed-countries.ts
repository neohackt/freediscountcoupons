/**
 * Seed script for Country master data (full ISO 3166-1 alpha-2 list).
 *
 * Usage:
 *   cd backend && npx tsx scripts/seed-countries.ts            # DRY RUN (default, read-only)
 *   cd backend && npx tsx scripts/seed-countries.ts --write    # create/update/publish
 *
 * Safety:
 * - Dry-run performs ZERO database writes (no Strapi boot, list validation only
 *   plus a read-only comparison when the dev server database is reachable — see below).
 *   Actually: dry-run DOES boot Strapi read-only to classify would-create /
 *   would-update actions, but never calls create/update/publish.
 * - Stop the Strapi dev server before running (either mode) to avoid SQLite contention.
 * - Only the api::country.country collection is ever written. Coupons, stores,
 *   and all relations are never touched. Country.code is the unique identity;
 *   existing IDs and coupon assignments are preserved.
 */

import path from 'path';

const WRITE = process.argv.includes('--write');

interface CountrySeed {
  code: string;
  name: string;
}

const COUNTRIES: CountrySeed[] = [
  { code: "AD", name: "Andorra" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "AF", name: "Afghanistan" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AI", name: "Anguilla" },
  { code: "AL", name: "Albania" },
  { code: "AM", name: "Armenia" },
  { code: "AO", name: "Angola" },
  { code: "AQ", name: "Antarctica" },
  { code: "AR", name: "Argentina" },
  { code: "AS", name: "American Samoa" },
  { code: "AT", name: "Austria" },
  { code: "AU", name: "Australia" },
  { code: "AW", name: "Aruba" },
  { code: "AX", name: "Åland Islands" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BB", name: "Barbados" },
  { code: "BD", name: "Bangladesh" },
  { code: "BE", name: "Belgium" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BG", name: "Bulgaria" },
  { code: "BH", name: "Bahrain" },
  { code: "BI", name: "Burundi" },
  { code: "BJ", name: "Benin" },
  { code: "BL", name: "Saint Barthélemy" },
  { code: "BM", name: "Bermuda" },
  { code: "BN", name: "Brunei" },
  { code: "BO", name: "Bolivia" },
  { code: "BQ", name: "Bonaire, Sint Eustatius and Saba" },
  { code: "BR", name: "Brazil" },
  { code: "BS", name: "Bahamas" },
  { code: "BT", name: "Bhutan" },
  { code: "BV", name: "Bouvet Island" },
  { code: "BW", name: "Botswana" },
  { code: "BY", name: "Belarus" },
  { code: "BZ", name: "Belize" },
  { code: "CA", name: "Canada" },
  { code: "CC", name: "Cocos (Keeling) Islands" },
  { code: "CD", name: "Congo (Democratic Republic)" },
  { code: "CF", name: "Central African Republic" },
  { code: "CG", name: "Congo (Republic)" },
  { code: "CH", name: "Switzerland" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "CK", name: "Cook Islands" },
  { code: "CL", name: "Chile" },
  { code: "CM", name: "Cameroon" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" },
  { code: "CU", name: "Cuba" },
  { code: "CV", name: "Cabo Verde" },
  { code: "CW", name: "Curaçao" },
  { code: "CX", name: "Christmas Island" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DE", name: "Germany" },
  { code: "DJ", name: "Djibouti" },
  { code: "DK", name: "Denmark" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "DZ", name: "Algeria" },
  { code: "EC", name: "Ecuador" },
  { code: "EE", name: "Estonia" },
  { code: "EG", name: "Egypt" },
  { code: "EH", name: "Western Sahara" },
  { code: "ER", name: "Eritrea" },
  { code: "ES", name: "Spain" },
  { code: "ET", name: "Ethiopia" },
  { code: "FI", name: "Finland" },
  { code: "FJ", name: "Fiji" },
  { code: "FK", name: "Falkland Islands" },
  { code: "FM", name: "Micronesia" },
  { code: "FO", name: "Faroe Islands" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GB", name: "United Kingdom" },
  { code: "GD", name: "Grenada" },
  { code: "GE", name: "Georgia" },
  { code: "GF", name: "French Guiana" },
  { code: "GG", name: "Guernsey" },
  { code: "GH", name: "Ghana" },
  { code: "GI", name: "Gibraltar" },
  { code: "GL", name: "Greenland" },
  { code: "GM", name: "Gambia" },
  { code: "GN", name: "Guinea" },
  { code: "GP", name: "Guadeloupe" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "GR", name: "Greece" },
  { code: "GS", name: "South Georgia and the South Sandwich Islands" },
  { code: "GT", name: "Guatemala" },
  { code: "GU", name: "Guam" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HK", name: "Hong Kong" },
  { code: "HM", name: "Heard Island and McDonald Islands" },
  { code: "HN", name: "Honduras" },
  { code: "HR", name: "Croatia" },
  { code: "HT", name: "Haiti" },
  { code: "HU", name: "Hungary" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IM", name: "Isle of Man" },
  { code: "IN", name: "India" },
  { code: "IO", name: "British Indian Ocean Territory" },
  { code: "IQ", name: "Iraq" },
  { code: "IR", name: "Iran" },
  { code: "IS", name: "Iceland" },
  { code: "IT", name: "Italy" },
  { code: "JE", name: "Jersey" },
  { code: "JM", name: "Jamaica" },
  { code: "JO", name: "Jordan" },
  { code: "JP", name: "Japan" },
  { code: "KE", name: "Kenya" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "KH", name: "Cambodia" },
  { code: "KI", name: "Kiribati" },
  { code: "KM", name: "Comoros" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "KY", name: "Cayman Islands" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "LA", name: "Laos" },
  { code: "LB", name: "Lebanon" },
  { code: "LC", name: "Saint Lucia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LK", name: "Sri Lanka" },
  { code: "LR", name: "Liberia" },
  { code: "LS", name: "Lesotho" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" },
  { code: "LY", name: "Libya" },
  { code: "MA", name: "Morocco" },
  { code: "MC", name: "Monaco" },
  { code: "MD", name: "Moldova" },
  { code: "ME", name: "Montenegro" },
  { code: "MF", name: "Saint Martin (French part)" },
  { code: "MG", name: "Madagascar" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MK", name: "North Macedonia" },
  { code: "ML", name: "Mali" },
  { code: "MM", name: "Myanmar" },
  { code: "MN", name: "Mongolia" },
  { code: "MO", name: "Macao" },
  { code: "MP", name: "Northern Mariana Islands" },
  { code: "MQ", name: "Martinique" },
  { code: "MR", name: "Mauritania" },
  { code: "MS", name: "Montserrat" },
  { code: "MT", name: "Malta" },
  { code: "MU", name: "Mauritius" },
  { code: "MV", name: "Maldives" },
  { code: "MW", name: "Malawi" },
  { code: "MX", name: "Mexico" },
  { code: "MY", name: "Malaysia" },
  { code: "MZ", name: "Mozambique" },
  { code: "NA", name: "Namibia" },
  { code: "NC", name: "New Caledonia" },
  { code: "NE", name: "Niger" },
  { code: "NF", name: "Norfolk Island" },
  { code: "NG", name: "Nigeria" },
  { code: "NI", name: "Nicaragua" },
  { code: "NL", name: "Netherlands" },
  { code: "NO", name: "Norway" },
  { code: "NP", name: "Nepal" },
  { code: "NR", name: "Nauru" },
  { code: "NU", name: "Niue" },
  { code: "NZ", name: "New Zealand" },
  { code: "OM", name: "Oman" },
  { code: "PA", name: "Panama" },
  { code: "PE", name: "Peru" },
  { code: "PF", name: "French Polynesia" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "PL", name: "Poland" },
  { code: "PM", name: "Saint Pierre and Miquelon" },
  { code: "PN", name: "Pitcairn Islands" },
  { code: "PR", name: "Puerto Rico" },
  { code: "PS", name: "Palestine" },
  { code: "PT", name: "Portugal" },
  { code: "PW", name: "Palau" },
  { code: "PY", name: "Paraguay" },
  { code: "QA", name: "Qatar" },
  { code: "RE", name: "Réunion" },
  { code: "RO", name: "Romania" },
  { code: "RS", name: "Serbia" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SC", name: "Seychelles" },
  { code: "SD", name: "Sudan" },
  { code: "SE", name: "Sweden" },
  { code: "SG", name: "Singapore" },
  { code: "SH", name: "Saint Helena" },
  { code: "SI", name: "Slovenia" },
  { code: "SJ", name: "Svalbard and Jan Mayen" },
  { code: "SK", name: "Slovakia" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SM", name: "San Marino" },
  { code: "SN", name: "Senegal" },
  { code: "SO", name: "Somalia" },
  { code: "SR", name: "Suriname" },
  { code: "SS", name: "South Sudan" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SV", name: "El Salvador" },
  { code: "SX", name: "Sint Maarten (Dutch part)" },
  { code: "SY", name: "Syria" },
  { code: "SZ", name: "Eswatini" },
  { code: "TC", name: "Turks and Caicos Islands" },
  { code: "TD", name: "Chad" },
  { code: "TF", name: "French Southern and Antarctic Lands" },
  { code: "TG", name: "Togo" },
  { code: "TH", name: "Thailand" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TK", name: "Tokelau" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TN", name: "Tunisia" },
  { code: "TO", name: "Tonga" },
  { code: "TR", name: "Turkey" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TV", name: "Tuvalu" },
  { code: "TW", name: "Taiwan" },
  { code: "TZ", name: "Tanzania" },
  { code: "UA", name: "Ukraine" },
  { code: "UG", name: "Uganda" },
  { code: "UM", name: "United States Minor Outlying Islands" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VA", name: "Vatican City" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "VE", name: "Venezuela" },
  { code: "VG", name: "Virgin Islands (British)" },
  { code: "VI", name: "Virgin Islands (U.S.)" },
  { code: "VN", name: "Vietnam" },
  { code: "VU", name: "Vanuatu" },
  { code: "WF", name: "Wallis and Futuna" },
  { code: "WS", name: "Samoa" },
  { code: "YE", name: "Yemen" },
  { code: "YT", name: "Mayotte" },
  { code: "ZA", name: "South Africa" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

/** Deterministic ISO code → flag emoji (regional indicator symbols). */
export function flagFromCode(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
  );
}

/** Validate the master list itself (no DB access). Throws on any problem. */
function validateMasterList(list: CountrySeed[]): void {
  if (list.length !== 249) {
    throw new Error(`Expected 249 ISO countries, found ${list.length}`);
  }
  const seen = new Set<string>();
  for (const entry of list) {
    if (!/^[A-Z]{2}$/.test(entry.code)) {
      throw new Error(`Invalid code: ${JSON.stringify(entry.code)}`);
    }
    if (!entry.name || entry.name.trim() === '') {
      throw new Error(`Missing name for code: ${entry.code}`);
    }
    if (entry.code === 'GLOBAL') {
      throw new Error('GLOBAL pseudo-country is not allowed');
    }
    if (seen.has(entry.code)) {
      throw new Error(`Duplicate code: ${entry.code}`);
    }
    seen.add(entry.code);
    const flag = flagFromCode(entry.code);
    if (!flag) {
      throw new Error(`Could not generate flag for code: ${entry.code}`);
    }
  }
}

async function main() {
  console.log(`🌍 Country master seed — ${WRITE ? 'WRITE MODE' : 'DRY RUN (no writes)'}\n`);

  validateMasterList(COUNTRIES);
  console.log('✅ Master list valid: 249 unique uppercase ISO alpha-2 codes, all named, no GLOBAL entry.');
  console.log(`   Sample: US → United States ${flagFromCode('US')}, IN → India ${flagFromCode('IN')}, AR → Argentina ${flagFromCode('AR')}\n`);

  console.log('🚀 Bootstrapping Strapi (read-only in dry-run)...\n');

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const strapiFactory = require('@strapi/strapi');
  const app = strapiFactory.createStrapi({
    dir: path.resolve(__dirname, '..'),
    distDir: path.resolve(__dirname, '..', 'dist'),
  });

  await app.start();

  try {
    const existing = await app.db.query('api::country.country').findMany({});
    const byCode = new Map(existing.map((e: { code: string }) => [e.code, e]));

    let toCreate = 0;
    let toUpdate = 0;
    let toPublish = 0;
    let unchanged = 0;
    const lines: string[] = [];

    for (const { code, name } of COUNTRIES) {
      const flag = flagFromCode(code);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = byCode.get(code) as any;
      if (!current) {
        toCreate++;
        lines.push(`  + ${code} ${name} ${flag} — would create (published)`);
        if (WRITE) {
          const created = await app
            .documents('api::country.country')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .create({ data: { name, code, flag }, status: 'published' } as any);
          // Guard: ensure the record is actually published, whatever the
          // Strapi version does with `status` on create.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const check = (await app.db.query('api::country.country').findOne({
            where: { code },
          })) as any;
          if (check && !check.publishedAt && check.documentId) {
            await app.documents('api::country.country').publish({
              documentId: check.documentId,
            });
          }
          void created;
        }
        continue;
      }

      const patch: Record<string, string> = {};
      if (current.name !== name) patch.name = name;
      if (current.flag !== flag) patch.flag = flag;
      if (Object.keys(patch).length > 0) {
        toUpdate++;
        lines.push(`  ~ ${code} ${name} ${flag} — would update: ${Object.keys(patch).join(', ')}`);
        if (WRITE && current.documentId) {
          await app
            .documents('api::country.country')
            .update({ documentId: current.documentId, data: patch });
        }
      } else {
        unchanged++;
      }

      if (!current.publishedAt) {
        toPublish++;
        lines.push(`  ↑ ${code} — would publish draft`);
        if (WRITE && current.documentId) {
          await app.documents('api::country.country').publish({
            documentId: current.documentId,
          });
        }
      }
    }

    console.log(lines.join('\n'));
    console.log('\n📊 Summary:');
    console.log(`   ${WRITE ? 'Create' : 'Would create'}: ${toCreate}`);
    console.log(`   ${WRITE ? 'Update' : 'Would update'}: ${toUpdate}`);
    console.log(`   ${WRITE ? 'Publish' : 'Would publish'}: ${toPublish}`);
    console.log(`   Unchanged: ${unchanged}`);
    console.log(`   Total master records: ${COUNTRIES.length}`);

    if (WRITE) {
      // NOTE: with draftAndPublish, db rows come in draft+published pairs, so
      // count distinct documents (not rows): 249 documents expected.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all = (await app.db.query('api::country.country').findMany({})) as any[];
      const docIds = new Set(all.map((c) => c.documentId));
      const publishedDocs = new Set(all.filter((c) => c.publishedAt).map((c) => c.documentId));
      const codes = new Set(all.map((c: { code: string }) => c.code));
      console.log('\n🔍 Verification:');
      console.log(`   Country documents: ${docIds.size}`);
      console.log(`   Published documents: ${publishedDocs.size}`);
      console.log(`   Unique codes: ${codes.size}`);
      if (docIds.size !== 249 || publishedDocs.size !== 249 || codes.size !== 249) {
        throw new Error('Verification failed: expected 249 published countries with unique codes.');
      }
      console.log('   ✅ All 249 countries present, published, uniquely coded.');
    } else {
      console.log('\n✅ Dry run complete — 0 database writes performed.');
      console.log('   Re-run with --write to apply (stop the dev server first).');
    }
  } finally {
    await app.destroy();
    console.log('\n👋 Done.');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
