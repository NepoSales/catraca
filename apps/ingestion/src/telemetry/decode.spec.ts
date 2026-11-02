import { PositionReportedSchema } from '@catraca/contracts';
import { decodeTelemetry, toPositionReported } from './decode';

const message = {
  busId: 'bus-001',
  seq: 7,
  lat: -23.5614,
  lon: -46.6559,
  speedKmh: 32.5,
  heading: 128.7,
  recordedAt: '2026-11-02T12:00:00.000Z',
};
const TOPIC = 'buses/bus-001/position';
const bytes = (value: unknown) => Buffer.from(JSON.stringify(value));

describe('decodeTelemetry', () => {
  it('aceita uma mensagem válida no tópico certo', () => {
    expect(decodeTelemetry(TOPIC, bytes(message))).toEqual({ ok: true, message });
  });

  it('rejeita payload que não é JSON', () => {
    const result = decodeTelemetry(TOPIC, Buffer.from('{quebrado'));
    expect(result).toEqual({ ok: false, reason: 'payload não é JSON' });
  });

  it('rejeita mensagem fora do contrato, dizendo qual campo', () => {
    const result = decodeTelemetry(TOPIC, bytes({ ...message, lat: 120 }));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain('lat');
  });

  it('rejeita ônibus falando em nome de outro', () => {
    const result = decodeTelemetry('buses/bus-002/position', bytes(message));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain('difere do tópico');
  });

  it('rejeita tópico fora do padrão', () => {
    expect(decodeTelemetry('buses/bus-001/other', bytes(message)).ok).toBe(false);
  });
});

describe('toPositionReported', () => {
  const event = toPositionReported(message);

  it('gera um evento que respeita o contrato', () => {
    expect(PositionReportedSchema.safeParse(event).success).toBe(true);
  });

  it('usa busId:seq como eventId e a hora do GPS como occurredAt', () => {
    expect(event.eventId).toBe('bus-001:7');
    expect(event.occurredAt).toBe(message.recordedAt);
  });
});
