import { KafkaTopics, PositionReportedSchema } from '@catraca/contracts';
import { Logger } from '@nestjs/common';
import type { KafkaPublisher, OutgoingMessage } from '../kafka/kafka-publisher.service';
import { TelemetryService } from './telemetry.service';

const TOPIC = 'buses/bus-001/position';
const message = {
  busId: 'bus-001',
  seq: 7,
  lat: -23.5614,
  lon: -46.6559,
  speedKmh: 32.5,
  heading: 128.7,
  recordedAt: '2026-11-02T12:00:00.000Z',
};

/** Kafka falso: guarda o que seria publicado, ou falha se pedirmos. */
function setup(options: { failWith?: Error } = {}) {
  const published: OutgoingMessage[] = [];
  const kafka = {
    publish: async (msg: OutgoingMessage) => {
      if (options.failWith) throw options.failWith;
      published.push(msg);
    },
  } as KafkaPublisher;
  return { service: new TelemetryService(kafka), published };
}

// Os avisos e erros esperados nos testes não precisam poluir a saída.
beforeAll(() => Logger.overrideLogger(false));

describe('TelemetryService', () => {
  it('publica mensagem válida como PositionReported, com o busId como chave', async () => {
    const { service, published } = setup();
    await service.handle(TOPIC, Buffer.from(JSON.stringify(message)));

    expect(published).toHaveLength(1);
    const [sent] = published;
    expect(sent!.topic).toBe(KafkaTopics.PositionReported);
    expect(sent!.key).toBe('bus-001');
    expect(PositionReportedSchema.parse(JSON.parse(sent!.value)).eventId).toBe('bus-001:7');
  });

  it('manda mensagem inválida intacta para a dead letter, com o motivo', async () => {
    const { service, published } = setup();
    await service.handle(TOPIC, Buffer.from('lixo'));

    expect(published).toEqual([
      {
        topic: KafkaTopics.TelemetryDeadLetter,
        key: TOPIC,
        value: 'lixo',
        headers: expect.objectContaining({ reason: 'payload não é JSON', 'mqtt-topic': TOPIC }),
      },
    ]);
  });

  it('descarta a mesma mensagem recebida duas vezes', async () => {
    const { service, published } = setup();
    const bytes = Buffer.from(JSON.stringify(message));
    await service.handle(TOPIC, bytes);
    await service.handle(TOPIC, bytes);
    expect(published).toHaveLength(1);
  });

  it('deixa passar a reentrega de uma mensagem que falhou ao publicar', async () => {
    const published: OutgoingMessage[] = [];
    let kafkaUp = false;
    const kafka = {
      publish: async (msg: OutgoingMessage) => {
        if (!kafkaUp) throw new Error('Kafka fora do ar');
        published.push(msg);
      },
    } as KafkaPublisher;
    const service = new TelemetryService(kafka);
    const bytes = Buffer.from(JSON.stringify(message));

    await service.handle(TOPIC, bytes);
    kafkaUp = true;
    await service.handle(TOPIC, bytes);
    expect(published).toHaveLength(1);
  });

  it('não derruba o serviço quando o Kafka falha', async () => {
    const { service } = setup({ failWith: new Error('Kafka fora do ar') });
    await expect(service.handle(TOPIC, Buffer.from(JSON.stringify(message)))).resolves.toBeUndefined();
  });
});
