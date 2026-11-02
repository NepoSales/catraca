/** Token para o NestJS injetar a configuração onde for pedida. */
export const INGESTION_CONFIG = Symbol('INGESTION_CONFIG');

export interface IngestionConfig {
  mqttUrl: string;
  /** Endereços do Kafka. Do seu PC é localhost:9094; de dentro de um container, kafka:9092. */
  kafkaBrokers: string[];
}

export function loadConfig(): IngestionConfig {
  return {
    mqttUrl: process.env.MQTT_URL ?? 'mqtt://localhost:1883',
    kafkaBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
  };
}
