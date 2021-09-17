import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {ValidationPipe} from "@nestjs/common";
import * as requestIp from 'request-ip';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({transform: true}));
  app.enableCors();
  app.use(requestIp.mw());
  await app.listen(process.env.PORT || 3000);
}

bootstrap().then(
  () => {
    console.log('Started v2');
  }
);
