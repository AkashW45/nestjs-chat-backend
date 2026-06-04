import {MiddlewareConsumer, Module, NestModule, RequestMethod, Injectable, NestMiddleware, Logger, Controller, Get} from '@nestjs/common';
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
    ProfileController
  ],
  exports: []
})
@Controller()
export class VersionController {
  @Get('/version')
  getVersion(): { service: string; commit: string; timestamp: string } {
    return {
      service: 'profile-service',
      commit: process.env.GIT_COMMIT || 'unknown',
      timestamp: new Date().toISOString()
    };
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FollowsEntity]), UserModule],
  providers: [ProfileService],
  controllers: [
    ProfileController,
    VersionController
  ],
  exports: []
})
export class ProfileModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
      .apply(AuthMiddleware)
      .forRoutes({path: 'profiles/:username/follow', method: RequestMethod.ALL});
  }
}
