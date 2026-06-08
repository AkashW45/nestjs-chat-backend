import { Controller, Get, Injectable, Logger, MiddlewareConsumer, Module, NestMiddleware, NestModule, RequestMethod } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './article.entity';
import { Comment } from './comment.entity';
import { UserEntity } from '../user/user.entity';
import { FollowsEntity } from '../profile/follows.entity';
import { ArticleService } from './article.service';
import { AuthMiddleware } from '../user/auth.middleware';
import { UserModule } from '../user/user.module';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: any, res: any, next: () => void) {
    const { method } = req;
    const path = req.path;
    const startTime = Date.now();

    res.on('finish', () => {
      const elapsed = Date.now() - startTime;
      this.logger.log(
        `${new Date().toISOString()} | ${method} | ${path} | ${res.statusCode} | ${elapsed}ms`
      );
    });

    next();
  }
}

@Controller()
export class PingController {
  @Get('ping')
  ping(): string {
    return 'pong';
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity, Comment, UserEntity, FollowsEntity]), UserModule],
  providers: [ArticleService],
  controllers: [
    ArticleController,
    PingController
  ]
})
export class ArticleModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*')
      .apply(AuthMiddleware)
      .forRoutes(
        {path: 'articles/feed', method: RequestMethod.GET},
        {path: 'articles', method: RequestMethod.POST},
        {path: 'articles/:slug', method: RequestMethod.DELETE},
        {path: 'articles/:slug', method: RequestMethod.PUT},
        {path: 'articles/:slug/comments', method: RequestMethod.POST},
        {path: 'articles/:slug/comments/:id', method: RequestMethod.DELETE},
        {path: 'articles/:slug/favorite', method: RequestMethod.POST},
        {path: 'articles/:slug/favorite', method: RequestMethod.DELETE});
  }
}
