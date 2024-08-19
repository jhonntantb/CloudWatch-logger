import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { format, transports } from 'winston';
import {
  WinstonModuleOptions,
  WinstonModuleOptionsFactory,
} from 'nest-winston';
import * as WinstonCloudWatch from 'winston-cloudwatch';
import { LEVEL_LOGS } from './const/level-logs';

@Injectable()
export class WinstonConfigService implements WinstonModuleOptionsFactory {
  constructor(private configService: ConfigService) {}

  createWinstonModuleOptions():
    | Promise<WinstonModuleOptions>
    | WinstonModuleOptions {
    const logGroupName = this.configService.get<string>('LOG_GROUP_NAME');
    const logStreamName = this.configService.get<string>('LOG_STREAM_NAME');

    return {
      levels: LEVEL_LOGS,
      format: format.combine(format.timestamp(), format.json()),
      transports: this.obtainCloudWatchErrorTransport(
        logGroupName,
        logStreamName,
      ),
      exceptionHandlers: this.obtainCloudWatchExceptionTransport(
        logGroupName,
        logStreamName,
      ),
    };
  }

  private obtainCloudWatchErrorTransport(
    logGroupName: string,
    logStreamName: string,
  ) {
    let transportsList;

    if (process.env.APP_ENV === 'development') {
      transportsList = [new transports.File({ filename: logStreamName })];
    } else {
      transportsList = [
        new WinstonCloudWatch({
          logGroupName: logGroupName,
          logStreamName: logStreamName,
          awsRegion: this.configService.get<string>('AWS_REGION'),
          awsAccessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          awsSecretKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          level: 'error',
          messageFormatter: (logObject) => JSON.stringify(logObject),
        }),
        new WinstonCloudWatch({
          logGroupName: logGroupName,
          logStreamName: `timeRes-${logStreamName.split('-')[1]}`,
          awsRegion: this.configService.get<string>('AWS_REGION'),
          awsAccessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          awsSecretKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          level: 'info',
          messageFormatter: (logObject) => JSON.stringify(logObject),
        }),
        new WinstonCloudWatch({
          logGroupName: logGroupName,
          logStreamName: `audit-${logStreamName.split('-')[1]}`,
          awsRegion: this.configService.get<string>('AWS_REGION'),
          awsAccessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          awsSecretKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          level: 'debug',
          messageFormatter: (logObject) => JSON.stringify(logObject),
        }),
      ];
    }
    return transportsList;
  }

  private obtainCloudWatchExceptionTransport(
    logGroupName: string,
    logStreamName: string,
  ) {
    let exceptionTransportList;

    if (process.env.APP_ENV === 'development') {
      exceptionTransportList = [
        new transports.File({ filename: logStreamName }),
      ];
    } else {
      exceptionTransportList = [
        new WinstonCloudWatch({
          logGroupName: logGroupName,
          logStreamName: logStreamName,
          awsRegion: this.configService.get<string>('AWS_REGION'),
          awsAccessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          awsSecretKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          jsonMessage: true,
          messageFormatter: (logObject) => JSON.stringify(logObject),
        }),
      ];
    }
    return exceptionTransportList;
  }
}
