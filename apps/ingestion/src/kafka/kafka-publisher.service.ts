import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ProduceAcks, Producer, stringSerializers } from '@platformatic/kafka';
import { INGESTION_CONFIG, type IngestionConfig } from '../config';

export interface OutgoingMessage {
  topic: string;
  /** Mensagens com a mesma chave caem na mesma partição, em ordem. */
  key: string;
  value: string;
  headers?: Record<string, string>;
}

/**
 * Único ponto da Ingestão que fala com o Kafka.
 * O resto do serviço só chama `publish` e não sabe qual biblioteca está por baixo.
 */
@Injectable()
export class KafkaPublisher implements OnApplicationShutdown {
  private readonly producer: Producer<string, string, string, string>;

  constructor(@Inject(INGESTION_CONFIG) config: IngestionConfig) {
    this.producer = new Producer({
      clientId: 'ingestion',
      bootstrapBrokers: config.kafkaBrokers,
      serializers: stringSerializers,
      // Idempotente: se a confirmação se perder e o produtor reenviar,
      // o Kafka reconhece o lote repetido e grava só uma vez.
      idempotent: true,
      // Confirmado só quando todas as réplicas gravaram (exigido pelo modo idempotente).
      acks: ProduceAcks.ALL,
      // Tópico inexistente é erro de configuração, não algo para criar na hora.
      autocreateTopics: false,
    });
  }

  async publish(message: OutgoingMessage): Promise<void> {
    await this.producer.send({ messages: [message] });
  }

  // Roda depois que o MQTT já parou de entregar mensagens (ver MqttSubscriberService).
  async onApplicationShutdown() {
    await this.producer.close();
  }
}
