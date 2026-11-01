import { z } from 'zod';

/**
 * Todo evento no Kafka tem o mesmo envelope; só o payload muda.
 * Assim qualquer consumidor sabe ler eventId e eventType antes de olhar o resto.
 */
export const eventEnvelope = <
  TType extends string,
  TVersion extends number,
  TPayload extends z.ZodType,
>(
  eventType: TType,
  eventVersion: TVersion,
  payload: TPayload,
) =>
  z.object({
    /** Identificador único do evento; consumidores usam para descartar repetidos. */
    eventId: z.string().min(1),
    eventType: z.literal(eventType),
    /** Muda quando o payload muda de forma incompatível. */
    eventVersion: z.literal(eventVersion),
    /** Quando o fato aconteceu no mundo real. */
    occurredAt: z.iso.datetime(),
    payload,
  });
