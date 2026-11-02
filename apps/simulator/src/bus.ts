import type { TelemetryMessage } from '@catraca/contracts';
import type { Route } from './route';

const MAX_SPEED_KMH = 60;
/** Quanto a velocidade pode mudar, para mais ou para menos, a cada segundo. */
const SPEED_CHANGE_PER_S = 5;

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/**
 * Um ônibus fingindo ser o rastreador embarcado.
 *
 * O estado é só a distância percorrida na rota, a velocidade e o contador `seq`.
 * A função `random` é injetável para que os testes sejam previsíveis.
 */
export class SimulatedBus {
  private seq = 0;
  private distanceM: number;
  private speedKmh: number;

  constructor(
    readonly busId: string,
    private readonly route: Route,
    startDistanceM = 0,
    private readonly random: () => number = Math.random,
  ) {
    this.distanceM = startDistanceM;
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
