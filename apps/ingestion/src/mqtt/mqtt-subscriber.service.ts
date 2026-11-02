import { MQTT_POSITION_SUBSCRIPTION } from '@catraca/contracts';
import {
  BeforeApplicationShutdown,
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import mqtt, { type MqttClient } from 'mqtt';
import { INGESTION_CONFIG, type IngestionConfig } from '../config';
import { TelemetryService } from '../telemetry/telemetry.service';

/**
 * Assinatura compartilhada: com o prefixo $share/<grupo>/, o broker entrega cada
 * mensagem a só UMA das instâncias do grupo. Assim dá para rodar várias Ingestões
 * dividindo a carga, sem que cada posição seja processada por todas elas.
 */
const SHARED_SUBSCRIPTION = `$share/ingestion/${MQTT_POSITION_SUBSCRIPTION}`;

@Injectable()
export class MqttSubscriberService implements OnApplicationBootstrap, BeforeApplicationShutdown {
  private readonly logger = new Logger(MqttSubscriberService.name);
  private client?: MqttClient;

  constructor(
    @Inject(INGESTION_CONFIG) private readonly config: IngestionConfig,
    private readonly telemetry: TelemetryService,
  ) {}

  // Só começa a receber mensagens depois que todos os módulos estão prontos.
  async onApplicationBootstrap() {
    this.client = await mqtt.connectAsync(this.config.mqttUrl);

    // Contrapressão: o cliente MQTT só lê a próxima mensagem (e só confirma esta ao broker)
    // quando o callback é chamado, ou seja, depois que o Kafka confirmou a gravação.
    // Se o Kafka ficar lento, as mensagens esperam no broker, e não na memória do serviço.
    // Efeito colateral bom: as mensagens são processadas uma a uma, na ordem de chegada.
    this.client.handleMessage = (packet, done) => {
      const payload = Buffer.isBuffer(packet.payload) ? packet.payload : Buffer.from(packet.payload);
      void this.telemetry.handle(packet.topic, payload).finally(() => done());
    };

    this.client.on('error', (err) => this.logger.error(`Erro no MQTT: ${err.message}`));
    await this.client.subscribeAsync(SHARED_SUBSCRIPTION, { qos: 1 });
    this.logger.log(`Assinando ${SHARED_SUBSCRIPTION} em ${this.config.mqttUrl}`);
  }

  // Antes do shutdown geral: para de receber primeiro, para o Kafka fechar sem nada pendente.
  async beforeApplicationShutdown() {
    await this.client?.endAsync();
  }
}
