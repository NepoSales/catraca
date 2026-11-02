#!/bin/bash
# Cria os tópicos do Kafka. Executado pelo container kafka-init do docker-compose.
# Os nomes precisam bater com KafkaTopics em packages/contracts/src/topics.ts.
set -euo pipefail

BOOTSTRAP=kafka:9092
KAFKA_TOPICS=/opt/kafka/bin/kafka-topics.sh

create() {
  local topic=$1 partitions=$2
  shift 2
  "$KAFKA_TOPICS" --bootstrap-server "$BOOTSTRAP" --create --if-not-exists \
    --topic "$topic" --partitions "$partitions" --replication-factor 1 "$@"
}

# Posições: 6 partições permitem até 6 consumidores de um mesmo grupo em paralelo.
# Retenção de 1 dia: o histórico de longo prazo fica no Tracking, não no Kafka.
create telemetry.position-reported 6 --config retention.ms=86400000

# Dead letter: pouco volume, guardada por 7 dias para dar tempo de investigar.
create telemetry.dead-letter 1 --config retention.ms=604800000

"$KAFKA_TOPICS" --bootstrap-server "$BOOTSTRAP" --list
