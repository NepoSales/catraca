import type { Coordinates } from '@catraca/contracts';

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Distância em metros entre dois pontos, pela fórmula de haversine (Terra como esfera). */
export function distanceM(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Direção de a para b em graus, no intervalo [0, 360): 0 = norte, 90 = leste. */
export function bearingDeg(a: Coordinates, b: Coordinates): number {
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export interface RoutePoint extends Coordinates {
  heading: number;
}

/**
 * Traçado percorrido em ida e volta: o ônibus vai até o último ponto e retorna
 * pelo mesmo caminho. As distâncias acumuladas são calculadas uma vez só,
 * para que achar a posição a X metros do início seja barato.
 */
export class Route {
  private readonly path: Coordinates[];
  /** cumulative[i] = metros do início do caminho até path[i]. */
  private readonly cumulative: number[];
  readonly lengthM: number;

  constructor(
    readonly id: string,
    points: Coordinates[],
  ) {
    if (points.length < 2) throw new Error(`Rota ${id} precisa de pelo menos 2 pontos`);
    this.path = [...points, ...points.slice(0, -1).reverse()];
    this.cumulative = [0];
    for (let i = 1; i < this.path.length; i++) {
      this.cumulative.push(this.cumulative[i - 1]! + distanceM(this.path[i - 1]!, this.path[i]!));
    }
    this.lengthM = this.cumulative.at(-1)!;
  }

  /** Posição e direção a `distance` metros do início. Passou do fim, recomeça (volta ao ponto inicial). */
  pointAt(distance: number): RoutePoint {
    const d = ((distance % this.lengthM) + this.lengthM) % this.lengthM;
    // Último trecho cujo início está antes de d.
    let i = 0;
    while (i < this.path.length - 2 && this.cumulative[i + 1]! <= d) i++;

    const from = this.path[i]!;
    const to = this.path[i + 1]!;
    const segmentM = this.cumulative[i + 1]! - this.cumulative[i]!;
    const t = segmentM === 0 ? 0 : (d - this.cumulative[i]!) / segmentM;

    // Interpolação linear: em trechos de poucas centenas de metros o erro é desprezível.
    return {
      lat: from.lat + (to.lat - from.lat) * t,
      lon: from.lon + (to.lon - from.lon) * t,
      heading: bearingDeg(from, to),
    };
  }
}
