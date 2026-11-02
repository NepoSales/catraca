/**
 * Configuração por variáveis de ambiente, com padrões que funcionam
 * direto com o docker-compose rodando na sua máquina.
 */
export interface SimulatorConfig {
  mqttUrl: string;
  busCount: number;
  /** Intervalo entre duas leituras de cada ônibus, em milissegundos. */
  intervalMs: number;
}

function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo, recebido: "${raw}"`);
  }
  return value;
}

export function loadConfig(): SimulatorConfig {
  return {
    mqttUrl: process.env.MQTT_URL ?? 'mqtt://localhost:1883',
    busCount: positiveInt('BUS_COUNT', 10),
    intervalMs: positiveInt('INTERVAL_MS', 2000),
  };
}
