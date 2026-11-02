import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Contexto de aplicação, sem servidor HTTP: a Ingestão não expõe API,
  // só consome do MQTT e (no próximo passo) produz para o Kafka.
  // Uma linha por mensagem é útil para investigar, mas é ruído no dia a dia: só com DEBUG=1.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: process.env.DEBUG
      ? ['fatal', 'error', 'warn', 'log', 'debug']
      : ['fatal', 'error', 'warn', 'log'],
  });
  // Ao receber Ctrl+C ou SIGTERM, chama os hooks de shutdown e fecha as conexões.
  app.enableShutdownHooks();
}

void bootstrap();
