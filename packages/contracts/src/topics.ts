/**
 * Nomes dos tópicos Kafka. Formato: <domínio>.<assunto>.
 *
 * Mensagens de PositionReported usam o busId como chave: o Kafka garante
 * ordem só dentro de uma partição, e a chave faz todas as posições de um
 * mesmo ônibus caírem na mesma partição, em ordem.
 */
export const KafkaTopics = {
  PositionReported: 'telemetry.position-reported',
  /** Mensagens MQTT que falharam na validação, guardadas para análise. */
  TelemetryDeadLetter: 'telemetry.dead-letter',
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];
