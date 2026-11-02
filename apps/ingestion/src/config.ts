/** Token para o NestJS injetar a configuração onde for pedida. */
export const INGESTION_CONFIG = Symbol('INGESTION_CONFIG');

export interface IngestionConfig {
  mqttUrl: string;
}

export function loadConfig(): IngestionConfig {
  return {
    mqttUrl: process.env.MQTT_URL ?? 'mqtt://localhost:1883',
  };
}
