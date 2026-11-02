import { Module } from '@nestjs/common';
import { INGESTION_CONFIG, loadConfig } from './config';
import { MqttSubscriberService } from './mqtt/mqtt-subscriber.service';
import { TelemetryService } from './telemetry/telemetry.service';

@Module({
  providers: [
    { provide: INGESTION_CONFIG, useFactory: loadConfig },
    TelemetryService,
    MqttSubscriberService,
  ],
})
export class AppModule {}
