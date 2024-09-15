import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { format, transports } from 'winston';
import {
  WinstonModuleOptions,
  WinstonModuleOptionsFactory,
} from 'nest-winston';
import * as WinstonCloudwatch from 'winston-cloudwatch';

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
      rejectionHandlers: this.obtainCloudWatchRejectionTransport(
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
        new WinstonCloudwatch({
          logGroupName: logGroupName,
          logStreamName: logStreamName,
          awsRegion: this.configService.get<string>('AWS_REGION'),
          awsAccessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          awsSecretKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          level: 'error',
          jsonMessage: true,
          messageFormatter: (logObject) => JSON.stringify(logObject),
        }),
        new WinstonCloudwatch({
          logGroupName: logGroupName,
          logStreamName: `info-${logStreamName}`,
          awsRegion: this.configService.get<string>('AWS_REGION'),
          awsAccessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          awsSecretKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          level: 'info',
          jsonMessage: true,
          messageFormatter: (logObject) => JSON.stringify(logObject),
        }),
        new WinstonCloudwatch({
          logGroupName: logGroupName,
          logStreamName: `debug-${logStreamName}`,
          awsRegion: this.configService.get<string>('AWS_REGION'),
          awsAccessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          awsSecretKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          level: 'debug',
          jsonMessage: true,
          messageFormatter: (logObject) => {
            return JSON.stringify({
              timestamp: logObject.timestamp,
              level: logObject.level,
              message: logObject.message,
              path: logObject.path,
              statusCode: logObject.statusCode,
            });
          },
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
        new WinstonCloudwatch({
          logGroupName: logGroupName,
          logStreamName: `exception-${logStreamName}`,
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
  private obtainCloudWatchRejectionTransport(
    logGroupName: string,
    logStreamName: string,
  ) {
    let rejectionTransportList;

    if (process.env.APP_ENV === 'development') {
      rejectionTransportList = [
        new transports.File({ filename: logStreamName }),
      ];
    } else {
      rejectionTransportList = [
        new WinstonCloudwatch({
          logGroupName: logGroupName,
          logStreamName: `rejection-${logStreamName}`,
          awsRegion: this.configService.get<string>('AWS_REGION'),
          awsAccessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          awsSecretKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          jsonMessage: true,
          messageFormatter: (logObject) => JSON.stringify(logObject),
        }),
      ];
    }
    return rejectionTransportList;
  }
}
