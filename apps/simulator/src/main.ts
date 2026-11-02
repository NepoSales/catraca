import { mqttPositionTopic, TelemetryMessageSchema } from '@catraca/contracts';
import mqtt from 'mqtt';
import { SimulatedBus } from './bus';
import { loadConfig } from './config';
import { SAMPLE_ROUTES } from './sample-routes';

/**
 * Distribui os ônibus entre as rotas (um em cada, em rodízio) e espalha os
 * que caem na mesma rota ao longo do traçado, para não andarem grudados.
 */
function createFleet(busCount: number): SimulatedBus[] {
  const routeCount = SAMPLE_ROUTES.length;
  // Em milissegundos, para o seq de um novo início sempre superar o do anterior.
  const firstSeq = Date.now();
  return Array.from({ length: busCount }, (_, i) => {
    const route = SAMPLE_ROUTES[i % routeCount]!;
    const busesOnRoute = Math.ceil((busCount - (i % routeCount)) / routeCount);
    const indexOnRoute = Math.floor(i / routeCount);
    const busId = `bus-${String(i + 1).padStart(3, '0')}`;
    const startDistanceM = (route.lengthM * indexOnRoute) / busesOnRoute;
    return new SimulatedBus(busId, route, { startDistanceM, firstSeq });
  });
}

async function main() {
  const config = loadConfig();
  const fleet = createFleet(config.busCount);
  const client = await mqtt.connectAsync(config.mqttUrl);
  console.log(`Conectado a ${config.mqttUrl}. Simulando ${fleet.length} ônibus a cada ${config.intervalMs} ms.`);

  let published = 0;
  const tick = async () => {
    const now = new Date();
    await Promise.all(
      fleet.map((bus) => {
        bus.advance(config.intervalMs / 1000);
        // Valida antes de mandar: se o simulador gerar algo inválido, o erro é dele.
        const message = TelemetryMessageSchema.parse(bus.read(now));
        // QoS 1: o broker confirma o recebimento; a mensagem pode chegar repetida, nunca perdida.
        return client.publishAsync(mqttPositionTopic(bus.busId), JSON.stringify(message), { qos: 1 });
      }),
    );
    published += fleet.length;
  };

  const timer = setInterval(() => {
    tick().catch((err) => console.error('Falha ao publicar:', err));
  }, config.intervalMs);
  const report = setInterval(() => console.log(`${published} posições publicadas`), 10_000);

  const shutdown = async () => {
    clearInterval(timer);
    clearInterval(report);
    await client.endAsync();
    console.log(`Encerrado. Total: ${published} posições.`);
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
