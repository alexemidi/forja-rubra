/**
 * Regras de Empunhadura, Estilo de Uma Arma e Estilo de Duas Armas (Tormenta 20).
 */

export type WeaponGripType = 'leve' | 'uma_mao' | 'duas_maos';

export interface HeldItemRecord {
  id: string;
  entry: any;
  item: {
    id: string;
    nome: string;
    tipo: string;
    arma?: {
      combateId?: string;
      empunhaduraId?: WeaponGripType;
      propriedadesIds?: string[];
    } | null;
    escudo?: {
      bonusDefesa?: number;
      penalidade?: number;
    } | null;
    espacos?: number;
  };
  grip: WeaponGripType;
}

export function resolveWeaponGrip(
  item: any,
  slotId: string,
  adaptableHandedness?: Record<string, WeaponGripType>,
): WeaponGripType {
  const props: string[] = Array.isArray(item?.arma?.propriedadesIds)
    ? item.arma.propriedadesIds
    : [];
  if (props.includes('adaptavel')) {
    return adaptableHandedness?.[slotId] || 'uma_mao';
  }
  const emp = item?.arma?.empunhaduraId;
  if (emp === 'leve' || emp === 'uma_mao' || emp === 'duas_maos') {
    return emp;
  }
  return 'uma_mao';
}

export function isSingleWeaponStyleActive(
  heldRecords: HeldItemRecord[],
  targetEntry?: any,
): boolean {
  if (!Array.isArray(heldRecords) || heldRecords.length !== 1) return false;
  const record = heldRecords[0];
  if (record.item.tipo !== 'arma') return false;
  if (record.item.arma?.combateId === 'a_distancia') return false;
  if (record.item.id === 'ataque_desarmado') return false;
  if (record.grip === 'duas_maos') return false;
  if (!targetEntry) return true;
  return (
    targetEntry === record.entry ||
    Boolean(targetEntry.uid && targetEntry.uid === record.entry?.uid) ||
    Boolean(targetEntry.instanceId && targetEntry.instanceId === record.entry?.instanceId) ||
    JSON.stringify(targetEntry) === JSON.stringify(record.entry)
  );
}

export function isTwoHandedWeaponStyleActive(
  heldRecords: HeldItemRecord[],
  targetEntry?: any,
): boolean {
  if (!Array.isArray(heldRecords) || heldRecords.length !== 1) return false;
  const record = heldRecords[0];
  if (record.item.tipo !== 'arma') return false;
  if (record.item.arma?.combateId === 'a_distancia') return false;
  if (record.item.id === 'ataque_desarmado') return false;
  if (record.item.arma?.empunhaduraId === 'leve') return false;
  if (record.grip !== 'duas_maos') return false;
  if (!targetEntry) return true;
  return (
    targetEntry === record.entry ||
    Boolean(targetEntry.uid && targetEntry.uid === record.entry?.uid) ||
    Boolean(targetEntry.instanceId && targetEntry.instanceId === record.entry?.instanceId) ||
    JSON.stringify(targetEntry) === JSON.stringify(record.entry)
  );
}

export function isWeaponAndShieldStyleActive(
  heldRecords: HeldItemRecord[],
): boolean {
  if (!Array.isArray(heldRecords) || heldRecords.length !== 2) return false;
  const hasWeapon = heldRecords.some(
    (r) => r.item.tipo === 'arma' && r.item.id !== 'ataque_desarmado' && r.grip !== 'duas_maos',
  );
  const hasShield = heldRecords.some(
    (r) => r.item.tipo === 'escudo' || Boolean(r.item.escudo),
  );
  return hasWeapon && hasShield;
}

export function isDualWeaponAttackReady(
  heldRecords: HeldItemRecord[],
  hasEstiloDuasArmas: boolean,
  hasArmaSecundariaGrande = false,
): boolean {
  if (!hasEstiloDuasArmas || !Array.isArray(heldRecords) || heldRecords.length !== 2) {
    return false;
  }
  const allValidWeapons = heldRecords.every(
    (r) => r.item.tipo === 'arma' && r.grip !== 'duas_maos',
  );
  const hasLightWeapon = hasArmaSecundariaGrande || heldRecords.some((r) => r.grip === 'leve');
  return allValidWeapons && hasLightWeapon;
}
