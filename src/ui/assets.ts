// ============================================
// Assets
// ============================================
import manifest from '../../public/assets/manifest.json';

export type Group = 'dinos' | 'grounds' | 'sky' | 'marks';

const paths = manifest as Record<Group, Record<string, string>>;

const GROUNDS = ['earth', 'orbit', 'moon', 'belt', 'mars', 'jupiter', 'saturn', 'neptune', 'deep', 'star'];

export function asset(group: Group, key: string): string {
  const path = paths[group][key];
  if (!path) throw new Error(`unknown asset: ${group}/${key}`);
  return path;
}

export function groundFor(legIndex: number): string {
  return asset('grounds', GROUNDS[legIndex]);
}
