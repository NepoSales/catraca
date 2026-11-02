import type { TelemetryMessage } from '@catraca/contracts';
import type { Route } from './route';

const MAX_SPEED_KMH = 60;
/** Quanto a velocidade pode mudar, para mais ou para menos, a cada segundo. */
const SPEED_CHANGE_PER_S = 5;

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export interface SimulatedBusOptions {
  /** Onde o ônibus começa, em metros a partir do início da rota. */
  startDistanceM?: number;
  /**
   * Primeiro número de sequência. Rastreadores reais guardam o contador e continuam
   * de onde pararam ao religar; se ele voltasse a 0, "bus-001:0" se repetiria e
   * seria descartado como duplicado. O simulador passa o horário de início para imitar isso.
   */
  firstSeq?: number;
  random?: () => number;
}

/**
 * Um ônibus fingindo ser o rastreador embarcado.
 *
 * O estado é só a distância percorrida na rota, a velocidade e o contador `seq`.
 * A função `random` é injetável para que os testes sejam previsíveis.
 */
export class SimulatedBus {
  private seq: number;
  private distanceM: number;
  private speedKmh: number;
  private readonly random: () => number;

  constructor(
    readonly busId: string,
    private readonly route: Route,
    options: SimulatedBusOptions = {},
  ) {
    this.distanceM = options.startDistanceM ?? 0;
    this.seq = options.firstSeq ?? 0;
    this.random = options.random ?? Math.random;
    this.speedKmh = MAX_SPEED_KMH / 2;
  }

  /** Avança `elapsedS` segundos: muda um pouco a velocidade e anda na rota. */
  advance(elapsedS: number): void {
    const change = (this.random() * 2 - 1) * SPEED_CHANGE_PER_S * elapsedS;
    this.speedKmh = Math.min(MAX_SPEED_KMH, Math.max(0, this.speedKmh + change));
    this.distanceM += (this.speedKmh / 3.6) * elapsedS;
  }

  /** Lê o "GPS" e monta a mensagem. Cada leitura recebe o próximo número de sequência. */
  read(now: Date): TelemetryMessage {
    const point = this.route.pointAt(this.distanceM);
    return {
      busId: this.busId,
      seq: this.seq++,
      lat: round(point.lat, 6),
      lon: round(point.lon, 6),
      speedKmh: round(this.speedKmh, 1),
      heading: round(point.heading, 1) % 360,
      recordedAt: now.toISOString(),
    };
  }
}
