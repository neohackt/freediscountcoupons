import {
  buildPaidTrafficStorePath,
  evaluatePaidTraffic,
  isPaidTrafficSource,
  readPaidTrafficParams,
  resolvePaidTrafficDestination,
  type PaidTrafficConfig,
} from './paid-traffic';

let failures = 0;

function check(actual: unknown, expected: unknown, description: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const pass = a === e;
  if (!pass) failures++;
  console.log(`${pass ? '✓' : '✗'} ${description}`);
  if (!pass) {
    console.log(`  Expected: ${e}`);
    console.log(`  Actual:   ${a}`);
  }
}

/**
 * Synthetic store records and click ids only. No live brand is referenced
 * and no store record is created for testing.
 */
const TEMPLATE_A = 'https://brand-a.example.net/track?o=22027551&a=30610&clickid={tid}&aff={aff_id}';
const TEMPLATE_B = 'https://brand-b.example.org/go/{tid}?o=111&a=222&offer={offerid}';

const TEMPLATE_SUB2 = 'https://brand-c.example.net/track?subId1={tid}&subId2={aff_sub2}';
const TEMPLATE_TEMU_STYLE = 'https://merchant.example/campaign?subId1={tid}&subId2={aff_sub2}&o=22081881&a=7124';
const TEMPLATE_ARBITRARY_SUB2 = 'https://example.com/campaign?subId1={tid}&subId2={aff_sub2}';

const storeC: PaidTrafficConfig = {
  name: 'Synthetic Store C',
  slug: 'synthetic-store-c',
  paid_traffic_enabled: true,
  paid_traffic_sources: ['paid'],
  paid_traffic_tracking_url: TEMPLATE_SUB2,
};

const AFF_SUB2 = 'zone-42';
const AFF_SUB2_SPECIAL = 'a b&c=d?e#f';

const storeA: PaidTrafficConfig = {
  name: 'Synthetic Store A',
  slug: 'synthetic-store-a',
  paid_traffic_enabled: true,
  paid_traffic_sources: ['paid'],
  paid_traffic_tracking_url: TEMPLATE_A,
};

const storeB: PaidTrafficConfig = {
  name: 'Synthetic Store B',
  slug: 'synthetic-store-b',
  paid_traffic_enabled: true,
  paid_traffic_sources: ['paid'],
  paid_traffic_tracking_url: TEMPLATE_B,
};

const TID = 'O18ABC789';
const AFFID = '30610';
const OFFERID = '22027551';

function testSourceDetection() {
  console.log('\n--- source detection ---');

  check(isPaidTrafficSource('paid'), true, '1. "paid" is a paid source');
  check(isPaidTrafficSource('pop'), false, '2. "pop" is not a paid source');
  check(isPaidTrafficSource('push'), false, '3. "push" is not a paid source');
  check(isPaidTrafficSource('domain'), false, '4. "domain" is not a paid source');
  check(isPaidTrafficSource('PAID'), false, '5. "PAID" is not a paid source');
  check(isPaidTrafficSource(null), false, '6. missing source is not a paid source');
  check(isPaidTrafficSource(''), false, '7. empty source is not a paid source');

  const params = readPaidTrafficParams({
    fdc_source: 'paid',
    fdc_tid: TID,
    fdc_affid: AFFID,
    fdc_offerid: OFFERID,
  });
  check(params.source, 'paid', '8. query source is read');
  check(params.tid, TID, '9. query tid is read');
  check(params.affid, AFFID, '10. query affid is read');
  check(params.offerid, OFFERID, '11. query offerid is read');
}

function testResolution() {
  console.log('\n--- destination resolution ---');

  const resolved = resolvePaidTrafficDestination({
    template: TEMPLATE_A,
    tid: TID,
    affid: AFFID,
    offerid: OFFERID,
  });
  check(
    resolved.ok ? resolved.destination : resolved,
    `https://brand-a.example.net/track?o=22027551&a=30610&clickid=${TID}&aff=${AFFID}`,
    '12. configured store resolves to its own tracking URL'
  );
  check(
    resolved.ok ? resolved.destination.includes(`clickid=${TID}`) : false,
    true,
    '13. {tid} carries the exact original click id'
  );
  check(
    resolved.ok ? resolved.destination.includes(`aff=${AFFID}`) : false,
    true,
    '14. {aff_id} carries the affiliate id'
  );
  check(
    resolved.ok ? resolved.destination.includes('o=22027551') : false,
    true,
    '15. static parameters are preserved'
  );

  const withOffer = resolvePaidTrafficDestination({
    template: TEMPLATE_B,
    tid: TID,
    affid: AFFID,
    offerid: OFFERID,
  });
  check(
    withOffer.ok ? withOffer.destination : withOffer,
    `https://brand-b.example.org/go/${TID}?o=111&a=222&offer=${OFFERID}`,
    '16. {offerid} resolves in the path and query'
  );

  const encoded = resolvePaidTrafficDestination({
    template: 'https://brand-a.example.net/track?clickid={tid}',
    tid: 'a b&c=d?e#f',
  });
  check(
    encoded.ok ? encoded.destination : encoded,
    'https://brand-a.example.net/track?clickid=a%20b%26c%3Dd%3Fe%23f',
    '17. inserted values are encoded correctly'
  );

  const noAff = resolvePaidTrafficDestination({
    template: 'https://brand-a.example.net/track?clickid={tid}&aff={aff_id}',
    tid: TID,
  });
  check(noAff.ok ? noAff.destination : noAff.reason, 'missing-affid', '18. missing {aff_id} value is rejected');

  const affNotRequired = resolvePaidTrafficDestination({
    template: 'https://brand-a.example.net/track?clickid={tid}',
    tid: TID,
  });
  check(
    affNotRequired.ok ? affNotRequired.destination : affNotRequired.reason,
    'https://brand-a.example.net/track?clickid=O18ABC789',
    '18b. {aff_id} is only required when the template uses it'
  );

  const noTid = resolvePaidTrafficDestination({
    template: 'https://brand-a.example.net/track?clickid={tid}',
    tid: '',
  });
  check(noTid.ok ? noTid.destination : noTid.reason, 'missing-tid', '19. missing {tid} value is rejected');

  const noOffer = resolvePaidTrafficDestination({
    template: 'https://brand-a.example.net/track?offer={offerid}',
    tid: TID,
  });
  check(
    noOffer.ok ? noOffer.destination : noOffer.reason,
    'missing-offerid',
    '20. missing {offerid} value is rejected'
  );

  const noTemplate = resolvePaidTrafficDestination({ template: '', tid: TID });
  check(noTemplate.ok ? noTemplate.destination : noTemplate.reason, 'missing-template', '21. empty template is rejected');

  const http = resolvePaidTrafficDestination({
    template: 'http://brand-a.example.net/track?clickid={tid}',
    tid: TID,
  });
  check(http.ok ? http.destination : http.reason, 'insecure-destination', '22. non-HTTPS destination is rejected');

  const unsupported = resolvePaidTrafficDestination({
    template: 'https://brand-a.example.net/track?clickid={tid}&ip={ip}',
    tid: TID,
  });
  check(
    unsupported.ok ? unsupported.destination : unsupported.reason,
    'unresolved-macro',
    '23. unsupported macro ({ip}) is rejected'
  );

  const googleMacro = resolvePaidTrafficDestination({
    template: 'https://brand-a.example.net/track?clickid={tid}&g={gclid}',
    tid: TID,
  });
  check(
    googleMacro.ok ? googleMacro.destination : googleMacro.reason,
    'unresolved-macro',
    '24. {gclid} is not a supported macro'
  );

  const broken = resolvePaidTrafficDestination({
    template: 'not a url at all {tid}',
    tid: TID,
  });
  check(broken.ok ? broken.destination : broken.reason, 'invalid-template', '25. invalid URL is rejected');
}

function testEvaluation() {
  console.log('\n--- per store evaluation ---');

  const params = { source: 'paid', tid: TID, affid: AFFID, offerid: OFFERID };

  const a = evaluatePaidTraffic({ config: storeA, params });
  check(
    a.ok ? a.destination : a,
    `https://brand-a.example.net/track?o=22027551&a=30610&clickid=${TID}&aff=${AFFID}`,
    '26. store A resolves to its own template'
  );

  const b = evaluatePaidTraffic({ config: storeB, params });
  check(
    b.ok ? b.destination : b,
    `https://brand-b.example.org/go/${TID}?o=111&a=222&offer=${OFFERID}`,
    '27. store B resolves to its own template'
  );

  check(
    a.ok && b.ok ? a.destination !== b.destination : true,
    true,
    '28. one store configuration never leaks into another store'
  );

  const unknown = evaluatePaidTraffic({ config: null, params });
  check(unknown.ok ? unknown.destination : unknown.reason, 'store-not-found', '29. unknown store does not redirect');

  const disabled = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_enabled: false },
    params,
  });
  check(disabled.ok ? disabled.destination : disabled.reason, 'disabled', '30. disabled store does not redirect');

  const defaultConfig: PaidTrafficConfig = {
    name: 'Synthetic Store C',
    slug: 'synthetic-store-c',
    paid_traffic_enabled: false,
    paid_traffic_sources: [],
    paid_traffic_tracking_url: null,
  };
  const byDefault = evaluatePaidTraffic({ config: defaultConfig, params });
  check(byDefault.ok ? byDefault.destination : byDefault.reason, 'disabled', '31. store is disabled by default');

  const otherSource = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_sources: ['pop'] },
    params,
  });
  check(
    otherSource.ok ? otherSource.destination : otherSource.reason,
    'source-not-allowed',
    '32. source not in paid_traffic_sources does not redirect'
  );

  const notPaid = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: 'push' },
  });
  check(
    notPaid.ok ? notPaid.destination : notPaid.reason,
    'not-paid-source',
    '33. push source does not use the generic paid route'
  );

  const pop = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: 'pop' },
  });
  check(
    pop.ok ? pop.destination : pop.reason,
    'not-paid-source',
    '33b. pop source does not use the generic paid route'
  );

  const domain = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: 'domain' },
  });
  check(
    domain.ok ? domain.destination : domain.reason,
    'not-paid-source',
    '33c. domain source does not use the generic paid route'
  );
}

function testReferrerPath() {
  console.log('\n--- referrer path ---');

  const path = buildPaidTrafficStorePath('synthetic-store-a');
  check(path, '/store/synthetic-store-a', '34. clean store path is used as referrer');
  check(path.includes('?'), false, '35. clean store path carries no query string');
  check(path.includes(TID), false, '36. click id is absent from the referrer path');
  check(path.includes('fdc_'), false, '37. no tracking parameter is present in the referrer path');
}

function testFailClosed() {
  console.log('\n--- fail-closed (security) ---');

  const params = { source: 'paid', tid: TID, affid: AFFID, offerid: OFFERID };

  // 1. null config → store-not-found
  const nullConfig = evaluatePaidTraffic({ config: null, params });
  check(nullConfig.ok ? nullConfig.destination : nullConfig.reason, 'store-not-found', '38. null config → store-not-found (no redirect)');

  // 2. undefined config → store-not-found
  const undefConfig = evaluatePaidTraffic({ config: undefined, params });
  check(undefConfig.ok ? undefConfig.destination : undefConfig.reason, 'store-not-found', '39. undefined config → store-not-found (no redirect)');

  // 3. paid_traffic_enabled = false → disabled
  const disabledConfig = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_enabled: false },
    params,
  });
  check(disabledConfig.ok ? disabledConfig.destination : disabledConfig.reason, 'disabled', '40. disabled store → disabled (no redirect)');

  // 4. paid_traffic_enabled = undefined → disabled
  const undefEnabled = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_enabled: undefined as unknown as boolean },
    params,
  });
  check(undefEnabled.ok ? undefEnabled.destination : undefEnabled.reason, 'disabled', '41. undefined enabled → disabled (no redirect)');

  // 5. paid_traffic_enabled = null → disabled
  const nullEnabled = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_enabled: null as unknown as boolean },
    params,
  });
  check(nullEnabled.ok ? nullEnabled.destination : nullEnabled.reason, 'disabled', '42. null enabled → disabled (no redirect)');

  // 6. empty sources → source-not-allowed
  const emptySources = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_sources: [] },
    params,
  });
  check(emptySources.ok ? emptySources.destination : emptySources.reason, 'source-not-allowed', '43. empty sources → source-not-allowed (no redirect)');

  // 7. null sources → source-not-allowed
  const nullSources = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_sources: null as unknown as string[] },
    params,
  });
  check(nullSources.ok ? nullSources.destination : nullSources.reason, 'source-not-allowed', '44. null sources → source-not-allowed (no redirect)');

  // 8. null tracking URL → missing-template
  const nullTemplate = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_tracking_url: null },
    params,
  });
  check(nullTemplate.ok ? nullTemplate.destination : nullTemplate.reason, 'missing-template', '45. null tracking URL → missing-template (no redirect)');

  // 9. empty tracking URL → missing-template
  const emptyTemplate = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_tracking_url: '' },
    params,
  });
  check(emptyTemplate.ok ? emptyTemplate.destination : emptyTemplate.reason, 'missing-template', '46. empty tracking URL → missing-template (no redirect)');

  // 10. whitespace-only tracking URL → missing-template
  const wsTemplate = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_tracking_url: '   ' },
    params,
  });
  check(wsTemplate.ok ? wsTemplate.destination : wsTemplate.reason, 'missing-template', '47. whitespace-only tracking URL → missing-template (no redirect)');

  // 11. non-HTTPS template → insecure-destination
  const httpTemplate = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_tracking_url: 'http://example.com/track?tid={tid}' },
    params,
  });
  check(httpTemplate.ok ? httpTemplate.destination : httpTemplate.reason, 'insecure-destination', '48. HTTP template → insecure-destination (no redirect)');

  // 12. unresolved macro → unresolved-macro
  const unresolvedMacro = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_tracking_url: 'https://example.com/track?tid={tid}&ip={ip}' },
    params,
  });
  check(unresolvedMacro.ok ? unresolvedMacro.destination : unresolvedMacro.reason, 'unresolved-macro', '49. unresolved macro {ip} → unresolved-macro (no redirect)');

  // 13. missing tid → missing-tid
  const missingTid = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, tid: null },
  });
  check(missingTid.ok ? missingTid.destination : missingTid.reason, 'missing-tid', '50. missing tid → missing-tid (no redirect)');

  // 14. missing affid → missing-affid
  const missingAffid = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, affid: null },
  });
  check(missingAffid.ok ? missingAffid.destination : missingAffid.reason, 'missing-affid', '51. missing affid → missing-affid (no redirect)');

  // 15. missing offerid (when template uses it) → missing-offerid
  const storeWithOffer = { ...storeA, paid_traffic_tracking_url: 'https://example.com/track?tid={tid}&offer={offerid}' };
  const missingOfferid = evaluatePaidTraffic({
    config: storeWithOffer,
    params: { ...params, offerid: null },
  });
  check(missingOfferid.ok ? missingOfferid.destination : missingOfferid.reason, 'missing-offerid', '52. missing offerid → missing-offerid (no redirect)');

  // 16. source 'pop' → not-paid-source
  const popSource = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: 'pop' },
  });
  check(popSource.ok ? popSource.destination : popSource.reason, 'not-paid-source', '53. source pop → not-paid-source (no redirect)');

  // 17. source 'push' → not-paid-source
  const pushSource = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: 'push' },
  });
  check(pushSource.ok ? pushSource.destination : pushSource.reason, 'not-paid-source', '54. source push → not-paid-source (no redirect)');

  // 18. source 'domain' → not-paid-source
  const domainSource = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: 'domain' },
  });
  check(domainSource.ok ? domainSource.destination : domainSource.reason, 'not-paid-source', '55. source domain → not-paid-source (no redirect)');

  // 19. source null → not-paid-source
  const nullSource = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: null },
  });
  check(nullSource.ok ? nullSource.destination : nullSource.reason, 'not-paid-source', '56. source null → not-paid-source (no redirect)');

  // 20. source empty → not-paid-source
  const emptySource = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: '' },
  });
  check(emptySource.ok ? emptySource.destination : emptySource.reason, 'not-paid-source', '57. source empty → not-paid-source (no redirect)');

  // 21. source 'PAID' (uppercase) → not-paid-source
  const uppercaseSource = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: 'PAID' },
  });
  check(uppercaseSource.ok ? uppercaseSource.destination : uppercaseSource.reason, 'not-paid-source', '58. source PAID (uppercase) → not-paid-source (no redirect)');

  // 22. source with whitespace → not-paid-source
  const wsSource = evaluatePaidTraffic({
    config: storeA,
    params: { ...params, source: ' paid ' },
  });
  check(wsSource.ok ? wsSource.destination : wsSource.reason, 'not-paid-source', '59. source " paid " (whitespace) → not-paid-source (no redirect)');

  // 23. Config with empty sources and tracking URL → source-not-allowed
  const emptySourcesWithUrl = evaluatePaidTraffic({
    config: { ...storeA, paid_traffic_sources: [] },
    params,
  });
  check(emptySourcesWithUrl.ok ? emptySourcesWithUrl.destination : emptySourcesWithUrl.reason, 'source-not-allowed', '60. empty sources (with URL) → source-not-allowed (no redirect)');
}

function testAffSub2() {
  console.log('\\n--- aff_sub2 macro support ---');

  // 1. Read fdc_aff_sub2 from incoming query parameters
  const readParams = readPaidTrafficParams({
    fdc_source: 'paid',
    fdc_tid: TID,
    fdc_affid: AFFID,
    fdc_offerid: OFFERID,
    fdc_aff_sub2: AFF_SUB2,
  });
  check(readParams.affSub2, AFF_SUB2, '61. fdc_aff_sub2 is read from query parameters');

  const readMissing = readPaidTrafficParams({
    fdc_source: 'paid',
    fdc_tid: TID,
  });
  check(readMissing.affSub2, null, '62. missing fdc_aff_sub2 resolves to null');

  const readArray = readPaidTrafficParams({
    fdc_aff_sub2: [AFF_SUB2, 'ignored'],
  });
  check(readArray.affSub2, AFF_SUB2, '63. duplicate fdc_aff_sub2 keeps the first value');

  // 2. Resolve {aff_sub2} correctly
  const resolved = resolvePaidTrafficDestination({
    template: TEMPLATE_SUB2,
    tid: TID,
    affid: AFFID,
    offerid: OFFERID,
    affSub2: AFF_SUB2,
  });
  check(
    resolved.ok ? resolved.destination : resolved.reason,
    `https://brand-c.example.net/track?subId1=${TID}&subId2=${AFF_SUB2}`,
    '64. {aff_sub2} resolves to the incoming zone value'
  );

  // 3. URL encoding of special characters
  const encoded = resolvePaidTrafficDestination({
    template: 'https://brand-c.example.net/track?subId2={aff_sub2}',
    affSub2: AFF_SUB2_SPECIAL,
  });
  check(
    encoded.ok ? encoded.destination : encoded.reason,
    'https://brand-c.example.net/track?subId2=a%20b%26c%3Dd%3Fe%23f',
    '65. {aff_sub2} values are URL-encoded'
  );

  // 4. Template without {aff_sub2} does not require it
  const notRequired = resolvePaidTrafficDestination({
    template: 'https://brand-a.example.net/track?clickid={tid}',
    tid: TID,
    affSub2: null,
  });
  check(
    notRequired.ok ? notRequired.destination : notRequired.reason,
    'https://brand-a.example.net/track?clickid=O18ABC789',
    '66. {aff_sub2} is optional when the template does not use it'
  );

  // 5. Template with {aff_sub2} fails when missing
  const missing = resolvePaidTrafficDestination({
    template: TEMPLATE_SUB2,
    tid: TID,
    affSub2: null,
  });
  check(
    missing.ok ? missing.destination : missing.reason,
    'missing-aff-sub2',
    '67. missing {aff_sub2} is rejected distinctly'
  );

  // 6. Empty aff_sub2 fails safely
  const empty = resolvePaidTrafficDestination({
    template: TEMPLATE_SUB2,
    tid: TID,
    affSub2: '   ',
  });
  check(
    empty.ok ? empty.destination : empty.reason,
    'missing-aff-sub2',
    '68. empty {aff_sub2} is rejected'
  );

  // 7. Unsupported macros are still rejected
  const unsupported = resolvePaidTrafficDestination({
    template: 'https://brand-c.example.net/track?subId1={tid}&subId2={aff_sub2}&ip={ip}',
    tid: TID,
    affSub2: AFF_SUB2,
  });
  check(
    unsupported.ok ? unsupported.destination : unsupported.reason,
    'unresolved-macro',
    '69. unsupported macros remain rejected with {aff_sub2} present'
  );

  // 8. Existing macros remain unchanged
  const existing = resolvePaidTrafficDestination({
    template: TEMPLATE_A,
    tid: TID,
    affid: AFFID,
    offerid: OFFERID,
    affSub2: AFF_SUB2,
  });
  check(
    existing.ok ? existing.destination : existing.reason,
    `https://brand-a.example.net/track?o=22027551&a=30610&clickid=${TID}&aff=${AFFID}`,
    '70. adding affSub2 does not alter existing macro resolution'
  );

  // 9. Temu-style tracking URL resolves correctly
  const temu = resolvePaidTrafficDestination({
    template: TEMPLATE_TEMU_STYLE,
    tid: TID,
    affSub2: AFF_SUB2,
  });
  check(
    temu.ok ? temu.destination : temu.reason,
    `https://merchant.example/campaign?subId1=${TID}&subId2=${AFF_SUB2}&o=22081881&a=7124`,
    '71. Temu-style tracking URL resolves with {tid} and {aff_sub2}'
  );

  // 10. Arbitrary store configuration can use {aff_sub2}
  const arbitrary = resolvePaidTrafficDestination({
    template: TEMPLATE_ARBITRARY_SUB2,
    tid: TID,
    affSub2: AFF_SUB2,
  });
  check(
    arbitrary.ok ? arbitrary.destination : arbitrary.reason,
    `https://example.com/campaign?subId1=${TID}&subId2=${AFF_SUB2}`,
    '72. arbitrary store configuration can use {aff_sub2}'
  );

  // evaluatePaidTraffic passes affSub2 through
  const evaluated = evaluatePaidTraffic({
    config: storeC,
    params: { source: 'paid', tid: TID, affid: AFFID, offerid: OFFERID, affSub2: AFF_SUB2 },
  });
  check(
    evaluated.ok ? evaluated.destination : evaluated.reason,
    `https://brand-c.example.net/track?subId1=${TID}&subId2=${AFF_SUB2}`,
    '73. evaluatePaidTraffic resolves {aff_sub2}'
  );

  const evaluatedMissing = evaluatePaidTraffic({
    config: storeC,
    params: { source: 'paid', tid: TID, affid: AFFID, offerid: OFFERID, affSub2: null },
  });
  check(
    evaluatedMissing.ok ? evaluatedMissing.destination : evaluatedMissing.reason,
    'missing-aff-sub2',
    '74. evaluatePaidTraffic rejects missing required {aff_sub2}'
  );
}

function main() {
  console.log('=== paid-traffic Tests ===');
  testSourceDetection();
  testResolution();
  testEvaluation();
  testReferrerPath();
  testFailClosed();
  testAffSub2();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
