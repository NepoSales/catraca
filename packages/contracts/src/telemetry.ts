import { z } from 'zod';
import { LatitudeSchema, LongitudeSchema } from './geo';

/**
 * Contrato entre o rastreador (simulador) e a Ingestão, via MQTT.
 *
 * Cada ônibus publica no próprio tópico: buses/{busId}/position.
 * A Ingestão assina todos de uma vez com o curinga "+".
 */
export const mqttPositionTopic = (busId: string): string => `buses/${busId}/position`;
export const MQTT_POSITION_SUBSCRIPTION = 'buses/+/position';

export const TelemetryMessageSchema = z.object({
  busId: z.string().min(1),
  /** Contador crescente por ônibus. Junto com busId, identifica a mensagem de forma única. */
  seq: z.number().int().nonnegative(),
  lat: LatitudeSchema,
  lon: LongitudeSchema,
  speedKmh: z.number().min(0).max(200),
  /** Direção em graus: 0 = norte, 90 = leste. */
  heading: z.number().min(0).lt(360),
  /** Momento em que o rastreador leu o GPS (não quando a mensagem chegou). */
  recordedAt: z.iso.datetime(),
});

export type TelemetryMessage = z.infer<typeof TelemetryMessageSchema>;
