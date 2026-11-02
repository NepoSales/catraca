import {
  POSITION_REPORTED,
  positionEventId,
  type PositionReported,
  type TelemetryMessage,
  TelemetryMessageSchema,
} from '@catraca/contracts';

export type DecodeResult =
  | { ok: true; message: TelemetryMessage }
  | { ok: false; reason: string };

const TOPIC_PATTERN = /^buses\/([^/]+)\/position$/;

/**
 * Transforma o que chegou do MQTT (tópico + bytes) numa TelemetryMessage válida,
 * ou explica por que não deu. Nunca lança erro: mensagem ruim é um resultado esperado,
 * que vai para a dead letter, e não uma falha do serviço.
 */
export function decodeTelemetry(topic: string, payload: Buffer): DecodeResult {
  const topicBusId = TOPIC_PATTERN.exec(topic)?.[1];
  if (!topicBusId) return { ok: false, reason: `tópico inesperado: ${topic}` };

  let json: unknown;
  try {
    json = JSON.parse(payload.toString('utf8'));
  } catch {
    return { ok: false, reason: 'payload não é JSON' };
  }

  const parsed = TelemetryMessageSchema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(raiz)'}: ${i.message}`);
    return { ok: false, reason: `fora do contrato: ${issues.join('; ')}` };
  }

  // Um rastreador só pode falar por si: o busId da mensagem tem que bater com o do tópico.
  if (parsed.data.busId !== topicBusId) {
    return {
      ok: false,
      reason: `busId da mensagem (${parsed.data.busId}) difere do tópico (${topicBusId})`,
    };
  }

  return { ok: true, message: parsed.data };
}

/** Converte a mensagem do rastreador no evento que os outros serviços consomem. */
export function toPositionReported(message: TelemetryMessage): PositionReported {
  return {
    eventId: positionEventId(message.busId, message.seq),
    eventType: POSITION_REPORTED,
    eventVersion: 1,
    // O fato aconteceu quando o GPS foi lido, não quando a mensagem chegou aqui.
    occurredAt: message.recordedAt,
    payload: {
      busId: message.busId,
      sequence: message.seq,
      position: { lat: message.lat, lon: message.lon },
      speedKmh: message.speedKmh,
      heading: message.heading,
    },
  };
}
