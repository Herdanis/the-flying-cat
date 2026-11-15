// ============================================
// Species
// ============================================

export interface Species {
  key: string;
  name: string;
  colour: string;
}

export const SPECIES: Species[] = [
  { key: 'rex', name: 'Rex', colour: '#e2703a' },
  { key: 'stego', name: 'Stego', colour: '#4f9d69' },
  { key: 'trike', name: 'Trike', colour: '#8a7cf0' },
  { key: 'long', name: 'Long', colour: '#4a9fd8' },
  { key: 'ptero', name: 'Ptero', colour: '#d96ba0' },
  { key: 'anky', name: 'Anky', colour: '#d4a72c' },
];
