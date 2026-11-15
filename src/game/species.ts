// ============================================
// Species
// ============================================

export interface Species {
  key: string;
  name: string;
  colour: string;
}

export const SPECIES: Species[] = [
  { key: 'rex', name: 'Rex', colour: '#ff6b5a' },
  { key: 'stego', name: 'Stego', colour: '#4fb0ff' },
  { key: 'trike', name: 'Trike', colour: '#f5b21a' },
  { key: 'long', name: 'Long', colour: '#3fbf6f' },
  { key: 'ptero', name: 'Ptero', colour: '#9b6bff' },
  { key: 'anky', name: 'Anky', colour: '#ff8a3d' },
];
