import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AiModule } from "./ai/ai.module"
import { AuthModule } from "./auth/auth.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    AiModule,
  ],
})
export class AppModule {}
