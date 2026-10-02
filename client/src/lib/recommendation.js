/**
 * Recommendation logic based on PRD.md §6.
 * Computed client-side from 1h, 24h, and 7d price changes.
 */

function formatChange(val) {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${Math.abs(Number(val)).toFixed(1)}%`;
}

function buildReasonText(change24h, change7d) {
  const c24 = change24h !== null && change24h !== undefined && !isNaN(change24h) ? Number(change24h) : 0;
  const c7 = change7d !== null && change7d !== undefined && !isNaN(change7d) ? Number(change7d) : 0;

  const str24 = formatChange(c24);
  const str7 = formatChange(c7);

  const dir24 = c24 > 0 ? 'up' : c24 < 0 ? 'down' : 'flat';
  const dir7 = c7 > 0 ? 'up' : c7 < 0 ? 'down' : 'flat';

  // Both positive
  if (dir24 === 'up' && dir7 === 'up') {
    return `Up ${str24} in 24h and ${str7} in 7d`;
  }

  // Both negative
  if (dir24 === 'down' && dir7 === 'down') {
    return `Down ${str24} in 24h and ${str7} in 7d`;
  }

  // Mixed: up in 24h, down in 7d
  if (dir24 === 'up' && dir7 === 'down') {
    return `Up ${str24} in 24h, down ${str7} in 7d — mixed signals`;
  }

  // Mixed: down in 24h, up in 7d
  if (dir24 === 'down' && dir7 === 'up') {
    return `Down ${str24} in 24h, up ${str7} in 7d — mixed signals`;
  }

  // Flat cases
  if (dir24 === 'flat' && dir7 === 'up') {
    return `Flat in 24h, up ${str7} in 7d`;
  }
  if (dir24 === 'flat' && dir7 === 'down') {
    return `Flat in 24h, down ${str7} in 7d`;
  }
  if (dir24 === 'up' && dir7 === 'flat') {
    return `Up ${str24} in 24h, flat in 7d`;
  }
  if (dir24 === 'down' && dir7 === 'flat') {
    return `Down ${str24} in 24h, flat in 7d`;
  }

  return 'Flat in both 24h and 7d';
}

export function getBasicRecommendation({ change1h, change24h, change7d }) {
  let score = 0;
  if (change1h > 0) score += 0.5;
  else if (change1h < 0) score -= 0.5;

  if (change24h > 0) score += 1;
  else if (change24h < 0) score -= 1;

  if (change7d > 0) score += 1;
  else if (change7d < 0) score -= 1;

  let label;
  if (score >= 1.5) label = 'Bullish';
  else if (score <= -1.5) label = 'Bearish';
  else label = 'Neutral';

  const reason = buildReasonText(change24h, change7d);

  return { label, reason, score };
}
