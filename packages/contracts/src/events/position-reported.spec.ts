import { positionEventId, PositionReportedSchema } from './position-reported';

const valid = {
  eventId: 'bus-001:42',
  eventType: 'PositionReported',
  eventVersion: 1,
  occurredAt: '2026-11-01T12:00:00Z',
  payload: {
    busId: 'bus-001',
    sequence: 42,
    position: { lat: -23.5503, lon: -46.6339 },
    speedKmh: 35.5,
    heading: 90,
  },
};

describe('PositionReportedSchema', () => {
  it('aceita um evento válido', () => {
    expect(PositionReportedSchema.safeParse(valid).success).toBe(true);
  });

  it('rejeita outro tipo de evento', () => {
    const outro = { ...valid, eventType: 'BusRegistered' };
    expect(PositionReportedSchema.safeParse(outro).success).toBe(false);
  });

  it('rejeita versão diferente da suportada', () => {
    expect(PositionReportedSchema.safeParse({ ...valid, eventVersion: 2 }).success).toBe(false);
  });

  it('valida o payload, não só o envelope', () => {
    const invalido = { ...valid, payload: { ...valid.payload, position: { lat: 100, lon: 0 } } };
    expect(PositionReportedSchema.safeParse(invalido).success).toBe(false);
  });
});

describe('positionEventId', () => {
  it('é determinístico: mesma entrada, mesmo id', () => {
    expect(positionEventId('bus-001', 42)).toBe(positionEventId('bus-001', 42));
    expect(positionEventId('bus-001', 42)).toBe('bus-001:42');
  });

  it('muda quando a sequência muda', () => {
    expect(positionEventId('bus-001', 42)).not.toBe(positionEventId('bus-001', 43));
  });
});
