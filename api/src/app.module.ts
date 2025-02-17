import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import config from './configs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt.auth.guard';
import {GalleryModule} from "./modules/gallery/gallery.module";

@Module({
  imports: [
    MongooseModule.forRoot(config().mongoUrl),
    UserModule,
    AuthModule,
    GalleryModule
  ],
  providers: [JwtAuthGuard],
})
export class AppModule {}
