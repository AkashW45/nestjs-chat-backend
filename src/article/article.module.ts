import { Injectable, NestMiddleware, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
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
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;
    const timestamp = new Date().toISOString();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${timestamp} ${method} ${originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity, Comment, UserEntity, FollowsEntity]), UserModule],
  providers: [ArticleService],
  controllers: [
    ArticleController
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
