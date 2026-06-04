import {MiddlewareConsumer, Module, NestModule, RequestMethod, Injectable, NestMiddleware, Logger, Controller, Get, Header} from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { UserModule } from '../user/user.module';
import {UserEntity} from "../user/user.entity";
import {FollowsEntity} from "./follows.entity";
import {AuthMiddleware} from "../user/auth.middleware";
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const responseTime = Date.now() - startTime;
      this.logger.log(`${new Date().toISOString()} ${method} ${originalUrl} ${statusCode} ${responseTime}ms`);
    });

    next();
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FollowsEntity]), UserModule],
  providers: [ProfileService],
  controllers: [
    ProfileController,
    PingController
  ],
  exports: []
})
@Controller()
export class PingController {
  @Get('ping')
  @Header('Content-Type', 'text/plain')
  ping(): string {
    return 'pong';
  }
}

export class ProfileModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
      .apply(AuthMiddleware)
      .forRoutes({path: 'profiles/:username/follow', method: RequestMethod.ALL});
  }
}
