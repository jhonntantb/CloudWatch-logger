import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AppService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  getHello(): string {
    this.logger
      .child({
        class: 'AppService',
        method: this.getHello.name,
        info: 'se esta ejecutando el hello world',
      })
      .info('estas por obtener un Hello world');
    return 'Hello World!';
  }
  getThrowMessage(): string {
    try {
      throw new Error('se esta ejecutando mal esta llamada');
      return 'Hello World!';
    } catch (error) {
      this.logger
        .child({
          class: 'AppService',
          method: this.getHello.name,
          info: 'ocurrio un error en esta llamada',
        })
        .error(error.message);
      throw new BadRequestException(error.message);
    }
  }
}
