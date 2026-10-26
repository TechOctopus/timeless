export type City = {
  id: string
  name: string
  code: string
  tz: string
  lat: number
  lng: number
}

export type User = {
  id: string
  name: string
  username: string
  short: string
  emoji: string
  color: string
  home: string
}

export const CITIES: City[] = [
  { id: 'hnl', name: 'Honolulu', code: 'HNL', tz: 'Pacific/Honolulu', lat: 21.307, lng: -157.858 },
  { id: 'lax', name: 'Los Angeles', code: 'LAX', tz: 'America/Los_Angeles', lat: 34.052, lng: -118.244 },
  { id: 'mex', name: 'Mexico City', code: 'MEX', tz: 'America/Mexico_City', lat: 19.433, lng: -99.133 },
  { id: 'nyc', name: 'New York', code: 'NYC', tz: 'America/New_York', lat: 40.713, lng: -74.006 },
  { id: 'bue', name: 'Buenos Aires', code: 'BUE', tz: 'America/Argentina/Buenos_Aires', lat: -34.604, lng: -58.382 },
  { id: 'rek', name: 'Reykjavík', code: 'REK', tz: 'Atlantic/Reykjavik', lat: 64.147, lng: -21.942 },
  { id: 'lis', name: 'Lisbon', code: 'LIS', tz: 'Europe/Lisbon', lat: 38.722, lng: -9.139 },
  { id: 'lon', name: 'London', code: 'LON', tz: 'Europe/London', lat: 51.507, lng: -0.128 },
  { id: 'ber', name: 'Berlin', code: 'BER', tz: 'Europe/Berlin', lat: 52.52, lng: 13.405 },
  { id: 'vie', name: 'Vienna', code: 'VIE', tz: 'Europe/Vienna', lat: 48.208, lng: 16.373 },
  { id: 'waw', name: 'Warsaw', code: 'WAW', tz: 'Europe/Warsaw', lat: 52.23, lng: 21.01 },
  { id: 'cpt', name: 'Cape Town', code: 'CPT', tz: 'Africa/Johannesburg', lat: -33.925, lng: 18.424 },
  { id: 'msq', name: 'Minsk', code: 'MSQ', tz: 'Europe/Minsk', lat: 53.9, lng: 27.567 },
  { id: 'ist', name: 'Istanbul', code: 'IST', tz: 'Europe/Istanbul', lat: 41.008, lng: 28.978 },
  { id: 'add', name: 'Addis Ababa', code: 'ADD', tz: 'Africa/Addis_Ababa', lat: 9.03, lng: 38.74 },
  { id: 'dxb', name: 'Dubai', code: 'DXB', tz: 'Asia/Dubai', lat: 25.204, lng: 55.27 },
  { id: 'bom', name: 'Mumbai', code: 'BOM', tz: 'Asia/Kolkata', lat: 19.076, lng: 72.878 },
  { id: 'bkk', name: 'Bangkok', code: 'BKK', tz: 'Asia/Bangkok', lat: 13.756, lng: 100.502 },
  { id: 'dps', name: 'Bali', code: 'DPS', tz: 'Asia/Makassar', lat: -8.65, lng: 115.216 },
  { id: 'tyo', name: 'Tokyo', code: 'TYO', tz: 'Asia/Tokyo', lat: 35.676, lng: 139.65 },
  { id: 'syd', name: 'Sydney', code: 'SYD', tz: 'Australia/Sydney', lat: -33.869, lng: 151.209 },
  { id: 'akl', name: 'Auckland', code: 'AKL', tz: 'Pacific/Auckland', lat: -36.85, lng: 174.76 },
]

export const cityById = (id: string): City => CITIES.find((c) => c.id === id) ?? CITIES[0]

export const USERS: User[] = [
  { id: 'alex', name: 'Aleksander Volkov', username: 'dopewalker', short: 'ALEX', emoji: '🦊', color: '#4cc9f0', home: 'ber' },
  { id: 'kate', name: 'Katerina Amer', username: 'kate.amer', short: 'KATE', emoji: '🌸', color: '#ff6b9a', home: 'nyc' },
  { id: 'leo', name: 'Leo Haile', username: 'leo.h', short: 'LEO', emoji: '🦁', color: '#f5a524', home: 'add' },
  { id: 'yuki', name: 'Yuki Tanaka', username: 'yuki.t', short: 'YUKI', emoji: '🍙', color: '#a78bfa', home: 'tyo' },
  { id: 'sofi', name: 'Sofía Ruiz', username: 'sofi', short: 'SOFI', emoji: '💃', color: '#f87171', home: 'bue' },
  { id: 'ivan', name: 'Ivan Petrov', username: 'ivan.p', short: 'IVAN', emoji: '🐻', color: '#34d399', home: 'dxb' },
  { id: 'mia', name: 'Mia Clarke', username: 'mia.c', short: 'MIA', emoji: '🐨', color: '#60a5fa', home: 'syd' },
  { id: 'max', name: 'Max Novak', username: 'maxn', short: 'MAX', emoji: '🏄', color: '#fbbf24', home: 'lax' },
  { id: 'raj', name: 'Raj Mehta', username: 'rajm', short: 'RAJ', emoji: '🐘', color: '#fb923c', home: 'bom' },
  { id: 'ana', name: 'Ana Kovač', username: 'ana.k', short: 'ANA', emoji: '🌴', color: '#2dd4bf', home: 'vie' },
  { id: 'tom', name: 'Tom Becker', username: 'tomb', short: 'TOM', emoji: '🌮', color: '#e879f9', home: 'mex' },
  { id: 'nora', name: 'Nora Lind', username: 'nora.n', short: 'NORA', emoji: '❄️', color: '#93c5fd', home: 'rek' },
]

export const userById = (id: string): User => USERS.find((u) => u.id === id) ?? USERS[0]

/** People that show up after "Sync contacts". The rest are only findable by username. */
export const CONTACT_IDS = ['alex', 'kate', 'leo', 'yuki', 'sofi', 'ivan', 'mia']

/** Where people currently are, if not at home. */
export const INITIAL_LOCATIONS: Record<string, string> = { leo: 'cpt', sofi: 'lis', ana: 'dps' }

export const AVATAR_EMOJIS = ['😎', '🦊', '🐼', '🐙', '🦄', '🐸', '🌞', '🌙', '⚡️', '🍕', '🎧', '🚀']
export const AVATAR_COLORS = ['#f5d90a', '#4cc9f0', '#ff6b9a', '#34d399', '#a78bfa', '#fb923c', '#f87171', '#60a5fa']
