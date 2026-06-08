import { Injectable, Logger, MiddlewareConsumer, Module, NestModule, NestMiddleware, RequestMethod, Controller, Get, Header } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { AuthMiddleware } from './auth.middleware';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;
    const start = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const elapsed = Date.now() - start;
      this.logger.log(`${new Date().toISOString()} ${method} ${originalUrl} ${statusCode} ${elapsed}ms`);
    });

    next();
  }
}

@Controller('ping')
export class PingController {
  @Get()
  @Header('Content-Type', 'text/plain')
  getPing(): string {
    return 'pong';
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService],
  controllers: [
    UserController,
    PingController
  ],
  exports: [UserService]
})
export class UserModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*');

    consumer
      .apply(AuthMiddleware)
      .forRoutes({path: 'user', method: RequestMethod.GET}, {path: 'user', method: RequestMethod.PUT});
  }
}
