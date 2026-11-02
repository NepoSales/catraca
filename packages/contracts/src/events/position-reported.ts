import { z } from 'zod';
import { CoordinatesSchema } from '../geo';
import { eventEnvelope } from './envelope';

export const POSITION_REPORTED = 'PositionReported';

export const PositionReportedPayloadSchema = z.object({
  busId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  position: CoordinatesSchema,
  speedKmh: z.number().min(0),
  heading: z.number().min(0).lt(360),
});

export const PositionReportedSchema = eventEnvelope(
  POSITION_REPORTED,
  1,
  PositionReportedPayloadSchema,
);

export type PositionReportedPayload = z.infer<typeof PositionReportedPayloadSchema>;
export type PositionReported = z.infer<typeof PositionReportedSchema>;

/**
 * eventId determinístico: a mesma mensagem do rastreador sempre gera o mesmo id.
 * Se a Ingestão processar a mensagem duas vezes, os consumidores reconhecem a repetição.
 */
export const positionEventId = (busId: string, sequence: number): string =>
  `${busId}:${sequence}`;
