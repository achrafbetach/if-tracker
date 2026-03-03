/**
 * Maps airline ICAO 3-letter codes → IATA 2-letter codes.
 * Used to query the Planespotters.net photo API.
 */
export const ICAO_TO_IATA = {
  // North America
  AAL: 'AA', UAL: 'UA', DAL: 'DL', SWA: 'WN', ASA: 'AS',
  JBU: 'B6', FFT: 'F9', NKS: 'NK', HAL: 'HA', SXD: 'OO',
  SKW: 'OO', RPA: '9E', ENY: 'MQ', FDX: 'FX', UPS: '5X',
  ABX: 'GB', GTI: 'GT', WJA: 'WS', ACA: 'AC', TSC: 'TS',
  // Europe
  BAW: 'BA', AFR: 'AF', DLH: 'LH', KLM: 'KL', IBE: 'IB',
  SWR: 'LX', AUA: 'OS', AZA: 'AZ', TAP: 'TP', SAS: 'SK',
  FIN: 'AY', ICE: 'FI', AEE: 'A3', VIR: 'VS', EZY: 'U2',
  RYR: 'FR', WZZ: 'W6', VLG: 'VY', NOZ: 'HV', TRA: 'HV',
  BEL: 'SN', CSA: 'OK', LOT: 'LO', MAT: 'MT', ALK: 'AL',
  TCX: 'BY', TUI: 'TB', MON: 'ZB', EXS: 'LS', NJE: 'LS',
  // Middle East & Africa
  UAE: 'EK', QTR: 'QR', ETD: 'EY', SVA: 'SV', MEA: 'ME',
  RJA: 'RJ', GFA: 'GF', OMA: 'WY', IAW: 'IA', MSR: 'MS',
  RAM: 'AT', ETH: 'ET', SAA: 'SA', KQA: 'KQ', DTA: 'DT',
  TUN: 'TU', AAW: 'W3', PGT: 'PC', FDB: 'FZ', ABY: 'G9',
  // Asia
  SIA: 'SQ', CPA: 'CX', JAL: 'JL', ANA: 'NH', KAL: 'KE',
  AAR: 'OZ', THY: 'TK', PAL: 'PR', THA: 'TG', MAS: 'MH',
  GIA: 'GA', HVN: 'VN', EVA: 'BR', CAL: 'CI', CCA: 'CA',
  CSN: 'CZ', CES: 'MU', CHH: 'HO', SZX: 'ZH', CSZ: 'ZH',
  CDG: '3U', CXA: 'MF', HAO: 'HU', AHY: 'J2', IRN: 'IR',
  // Oceania & Pacific
  QFA: 'QF', ANZ: 'NZ', VNZ: 'NF', AIR: 'NZ', FOO: 'FJ',
  // Latin America
  AMX: 'AM', AVA: 'AV', LAN: 'LA', TAM: 'JJ', GOL: 'G3',
  AZU: 'AD', ARG: 'AR', TAB: 'BF', BOA: 'BO', PEA: 'H2',
  GLO: 'G3', CNF: 'DS',
  // Low-cost / Charter
  RUK: 'ZB', TOM: 'TOM', DY: 'DY', NAX: 'DY', IBK: 'I2',
};
 
/**
 * Maps airline name keywords → IATA codes.
 * Used for full-name callsigns like "Royal Air Maroc 752".
 * Sorted longest-first to avoid partial matches.
 */
const NAME_TO_IATA_RAW = {
  // Africa & Middle East
  'royal air maroc': 'AT',
  'middle east airlines': 'ME',
  'saudi arabian airlines': 'SV',
  'saudi arabian': 'SV',
  'kenya airways': 'KQ',
  'south african airways': 'SA',
  'south african': 'SA',
  'ethiopian airlines': 'ET',
  'air mauritius': 'MK',
  'royal jordanian': 'RJ',
  'oman air': 'WY',
  'gulf air': 'GF',
  'flydubai': 'FZ',
  'air arabia': 'G9',
  'tunisair': 'TU',
  'egyptair': 'MS',
  'saudia': 'SV',
  'emirates': 'EK',
  'etihad airways': 'EY',
  'etihad': 'EY',
  'qatar airways': 'QR',
  'pegasus airlines': 'PC',
  'pegasus': 'PC',
  // Europe
  'british airways': 'BA',
  'air france': 'AF',
  'virgin atlantic': 'VS',
  'swiss international': 'LX',
  'brussels airlines': 'SN',
  'austrian airlines': 'OS',
  'czech airlines': 'OK',
  'lot polish airlines': 'LO',
  'lot polish': 'LO',
  'scandinavian airlines': 'SK',
  'tap air portugal': 'TP',
  'tap portugal': 'TP',
  'iberia express': 'I2',
  'vueling airlines': 'VY',
  'wizz air': 'W6',
  'wizzair': 'W6',
  'transavia': 'HV',
  'icelandair': 'FI',
  'aegean airlines': 'A3',
  'condor': 'DE',
  'lufthansa': 'LH',
  'ryanair': 'FR',
  'easyjet': 'U2',
  'finnair': 'AY',
  'iberia': 'IB',
  'klm': 'KL',
  'swiss': 'LX',
  'vueling': 'VY',
  'aegean': 'A3',
  'wizz': 'W6',
  // North America
  'american airlines': 'AA',
  'united airlines': 'UA',
  'alaska airlines': 'AS',
  'jetblue airways': 'B6',
  'southwest airlines': 'WN',
  'delta air lines': 'DL',
  'hawaiian airlines': 'HA',
  'frontier airlines': 'F9',
  'spirit airlines': 'NK',
  'air canada': 'AC',
  'westjet': 'WS',
  'fedex express': 'FX',
  'ups airlines': '5X',
  'delta': 'DL',
  'united': 'UA',
  'alaska': 'AS',
  'jetblue': 'B6',
  'southwest': 'WN',
  'frontier': 'F9',
  'spirit': 'NK',
  'hawaiian': 'HA',
  // Asia
  'singapore airlines': 'SQ',
  'cathay pacific': 'CX',
  'japan airlines': 'JL',
  'all nippon airways': 'NH',
  'korean air': 'KE',
  'asiana airlines': 'OZ',
  'turkish airlines': 'TK',
  'thai airways': 'TG',
  'malaysia airlines': 'MH',
  'garuda indonesia': 'GA',
  'vietnam airlines': 'VN',
  'eva air': 'BR',
  'china airlines': 'CI',
  'air china': 'CA',
  'china southern': 'CZ',
  'china eastern': 'MU',
  'hainan airlines': 'HU',
  'shenzhen airlines': 'ZH',
  'xiamen airlines': 'MF',
  'sichuan airlines': '3U',
  'philippines airlines': 'PR',
  'philippine airlines': 'PR',
  'ana': 'NH',
  'asiana': 'OZ',
  'turkish': 'TK',
  'garuda': 'GA',
  // Oceania
  'air new zealand': 'NZ',
  'fiji airways': 'FJ',
  'qantas': 'QF',
  // Latin America
  'aeromexico': 'AM',
  'avianca': 'AV',
  'latam airlines': 'LA',
  'gol linhas': 'G3',
  'azul airlines': 'AD',
  'aerolineas argentinas': 'AR',
  'aeromexico connect': 'AM',
  'latam': 'LA',
  'gol': 'G3',
  'azul': 'AD',
};
 
// Pre-sort by key length descending to match longest names first
const NAME_TO_IATA_SORTED = Object.entries(NAME_TO_IATA_RAW)
  .sort((a, b) => b[0].length - a[0].length);
 
/**
 * Extract the 2–3 letter airline prefix from a standard ICAO callsign.
 * e.g. "BAW123" → "BAW", "RAM101" → "RAM", "AA100" → "AA"
 */
export function parseAirlineIcao(callsign) {
  if (!callsign) return null;
  const m = callsign.trim().match(/^([A-Z]{2,3})(?=\d)/i);
  return m ? m[1].toUpperCase() : null;
}
 
/**
 * Convert an airline ICAO code to IATA code.
 * Returns null if not found.
 */
export function airlineIcaoToIata(icaoCode) {
  if (!icaoCode) return null;
  return ICAO_TO_IATA[icaoCode.toUpperCase()] ?? null;
}
 
/**
 * Parse an IATA code from ANY callsign format:
 *  - Standard ICAO:  "RAM752"         → "AT"
 *  - 2-letter IATA:  "AT752"          → tries ICAO_TO_IATA first, then raw check
 *  - Full name:      "Royal Air Maroc 752" → "AT"
 *  - Mixed case:     "royal air maroc 752" → "AT"
 */
export function parseIataFromCallsign(callsign) {
  if (!callsign) return null;
  const cs = callsign.trim();
 
  // Strategy 1: standard ICAO prefix (e.g. "RAM752", "BAW123", "EK101")
  const icaoMatch = cs.match(/^([A-Z]{2,3})(?=\d)/i);
  if (icaoMatch) {
    const iata = ICAO_TO_IATA[icaoMatch[1].toUpperCase()];
    if (iata) return iata;
  }
 
  // Strategy 2: full airline name in callsign (e.g. "Royal Air Maroc 752")
  const lower = cs.toLowerCase();
  for (const [name, iata] of NAME_TO_IATA_SORTED) {
    if (lower.includes(name)) return iata;
  }
 
  return null;
}