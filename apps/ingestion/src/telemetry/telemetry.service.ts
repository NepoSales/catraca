import { KafkaTopics } from '@catraca/contracts';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { KafkaPublisher } from '../kafka/kafka-publisher.service';
import { decodeTelemetry, toPositionReported } from './decode';

const REPORT_EVERY_MS = 10_000;

/**
 * Decide o destino de cada mensagem que chega do MQTT:
 * - válida: vira PositionReported no tópico de posições, com o busId como chave;
 * - inválida: vai intacta para a dead letter, com o motivo nos headers.
 */
@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly counts = { accepted: 0, rejected: 0, failed: 0 };
  private reportTimer?: NodeJS.Timeout;

  constructor(private readonly kafka: KafkaPublisher) {}

  async handle(topic: string, payload: Buffer): Promise<void> {
    try {
      const result = decodeTelemetry(topic, payload);
      if (result.ok) {
        const event = toPositionReported(result.message);
        await this.kafka.publish({
          topic: KafkaTopics.PositionReported,
          key: event.payload.busId,
          value: JSON.stringify(event),
        });
        this.counts.accepted++;
        this.logger.debug(`PositionReported ${event.eventId}`);
      } else {
        // O payload original vai sem alteração; o contexto fica nos headers.
        await this.kafka.publish({
          topic: KafkaTopics.TelemetryDeadLetter,
          key: topic,
          value: payload.toString('utf8'),
          headers: {
            reason: result.reason,
            'mqtt-topic': topic,
            'received-at': new Date().toISOString(),
          },
        });
        this.counts.rejected++;
        this.logger.warn(`Mensagem rejeitada em ${topic}: ${result.reason}`);
      }
    } catch (err) {
      // O produtor já tentou de novo por conta própria. Se ainda falhou, a posição se perde.
      // Para telemetria é aceitável: a próxima posição do mesmo ônibus chega em segundos.
      this.counts.failed++;
      this.logger.error(`Falha ao publicar mensagem de ${topic}: ${(err as Error).message}`);
    }
  }

  // Um resumo periódico em vez de uma linha por mensagem, para o log não virar ruído.
  onModuleInit() {
    this.reportTimer = setInterval(() => {
      const { accepted, rejected, failed } = this.counts;
      this.logger.log(`Publicadas: ${accepted} | dead letter: ${rejected} | falhas: ${failed}`);
    }, REPORT_EVERY_MS);
  }

  onModuleDestroy() {
    clearInterval(this.reportTimer);
  }
}
