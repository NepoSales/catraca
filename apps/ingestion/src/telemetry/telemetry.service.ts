import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { decodeTelemetry, toPositionReported } from './decode';

const REPORT_EVERY_MS = 10_000;

/**
 * Decide o destino de cada mensagem que chega do MQTT.
 *
 * Por enquanto só conta e registra no log. No próximo passo, as válidas
 * serão publicadas no Kafka como PositionReported e as inválidas na dead letter.
 */
@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryService.name);
  private accepted = 0;
  private rejected = 0;
  private reportTimer?: NodeJS.Timeout;

  handle(topic: string, payload: Buffer): void {
    const result = decodeTelemetry(topic, payload);
    if (!result.ok) {
      this.rejected++;
      this.logger.warn(`Mensagem rejeitada em ${topic}: ${result.reason}`);
      return;
    }
    const event = toPositionReported(result.message);
    this.accepted++;
    this.logger.debug(`PositionReported ${event.eventId}`);
  }

  // Um resumo periódico em vez de uma linha por mensagem, para o log não virar ruído.
  onModuleInit() {
    this.reportTimer = setInterval(() => {
      this.logger.log(`Aceitas: ${this.accepted} | rejeitadas: ${this.rejected}`);
    }, REPORT_EVERY_MS);
  }

  onModuleDestroy() {
    clearInterval(this.reportTimer);
  }
}
