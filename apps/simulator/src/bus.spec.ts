import { TelemetryMessageSchema } from '@catraca/contracts';
import { SimulatedBus } from './bus';
import { Route } from './route';

const route = new Route('teste', [
  { lat: 0, lon: 0 },
  { lat: 0, lon: 0.01 },
]);
const now = new Date('2026-11-02T12:00:00Z');
/** random() = 0.5 não muda a velocidade: o ônibus anda sempre a 30 km/h. */
const steady = () => 0.5;

describe('SimulatedBus', () => {
  it('gera mensagens que respeitam o contrato', () => {
    const bus = new SimulatedBus('bus-001', route);
    for (let i = 0; i < 50; i++) {
      bus.advance(2);
      expect(TelemetryMessageSchema.safeParse(bus.read(now)).success).toBe(true);
    }
  });

  it('incrementa a sequência a cada leitura', () => {
    const bus = new SimulatedBus('bus-001', route);
    expect(bus.read(now).seq).toBe(0);
    expect(bus.read(now).seq).toBe(1);
  });

  it('anda na rota conforme a velocidade', () => {
    const bus = new SimulatedBus('bus-001', route, 0, steady);
    const start = bus.read(now).lon;
    bus.advance(12); // 30 km/h por 12 s = 100 m
    const message = bus.read(now);
    expect(message.speedKmh).toBe(30);
    expect(message.lon - start).toBeCloseTo(100 / 111_195, 5);
  });

  it('nunca passa dos limites de velocidade', () => {
    const speedingUp = new SimulatedBus('bus-001', route, 0, () => 1);
    const slowingDown = new SimulatedBus('bus-002', route, 0, () => 0);
    for (let i = 0; i < 100; i++) {
      speedingUp.advance(2);
      slowingDown.advance(2);
    }
    expect(speedingUp.read(now).speedKmh).toBe(60);
    expect(slowingDown.read(now).speedKmh).toBe(0);
  });
});
