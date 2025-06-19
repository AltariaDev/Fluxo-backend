import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Bienvenido a la API v0 de SherpApp";
  }
}
