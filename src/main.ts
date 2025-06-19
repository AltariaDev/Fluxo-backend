import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { config } from "dotenv";
import helmet from "helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import { Logger } from '@nestjs/common';

// Carga las variables de entorno
config();

async function sherpmain() {
  const logger = new Logger('Bootstrap');
  logger.log("Starting the application");

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  app.use((req, res, next) => {
	  req.app.set('trust proxy', 1);
	  next();
  });

  app.setGlobalPrefix("api/v0");

  // Middleware de seguridad HTTP
  app.use(helmet());

  // Middleware de seguridad CORS
  app.enableCors({
    origin: [
      "http://localhost:3000", 
      "http://localhost:4000",
      "https://sherp-app.com",
      "http://sherp-app.com",
      "https://develop.sherp-app.com",
      "http://develop.sherp-app.com",
      "wss://sherp-app.com:4323",
      "ws://sherp-app.com:4323",
      "https://develop.sherp-app.com",
      "http://develop.sherp-app.com",
      "wss://develop.sherp-app.com:4323",
      "ws://develop.sherp-app.com:4323"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['content-type', 'authorization', 'access-control-allow-origin', 'x-api-key'],
  });

  app.use(cookieParser());

  // Configuración global de validaciones
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en los DTOs
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma datos a los tipos de los DTOs
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("SherpApp API")
    .setDescription("API documentation for SherpApp")
    .setVersion("1.0")
    .addBearerAuth() // Para que se pueda autenticar con JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const PORT = process.env.PORT ?? 4000;
  await app.listen(PORT);

  logger.log(`Application running on port ${PORT}`);
}

sherpmain();
