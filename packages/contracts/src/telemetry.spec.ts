import { mqttPositionTopic, TelemetryMessageSchema } from './telemetry';

const valid = {
  busId: 'bus-001',
  seq: 42,
  lat: -23.5503,
  lon: -46.6339,
  speedKmh: 35.5,
  heading: 90,
  recordedAt: '2026-11-01T12:00:00Z',
};

describe('TelemetryMessageSchema', () => {
  it('aceita uma mensagem válida', () => {
    expect(TelemetryMessageSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['latitude fora do intervalo', { lat: -91 }],
    ['longitude fora do intervalo', { lon: 181 }],
    ['velocidade negativa', { speedKmh: -1 }],
    ['heading igual a 360', { heading: 360 }],
    ['sequência fracionária', { seq: 1.5 }],
    ['data sem formato ISO', { recordedAt: '01/11/2026 12:00' }],
    ['busId vazio', { busId: '' }],
  ])('rejeita %s', (_, override) => {
    expect(TelemetryMessageSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it('rejeita mensagem sem campo obrigatório', () => {
    const { lat: _, ...semLat } = valid;
    expect(TelemetryMessageSchema.safeParse(semLat).success).toBe(false);
  });

  it('descarta campos desconhecidos em vez de rejeitar', () => {
    const result = TelemetryMessageSchema.parse({ ...valid, firmware: '2.1' });
    expect(result).not.toHaveProperty('firmware');
  });
});

describe('mqttPositionTopic', () => {
  it('monta o tópico do ônibus', () => {
    expect(mqttPositionTopic('bus-001')).toBe('buses/bus-001/position');
  });
});
