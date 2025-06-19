import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { exec } from 'child_process';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

@Controller('admin')
export class AdminController {
  @Get('logs')
  async getLogs() {
    return new Promise((resolve, reject) => {
      exec('journalctl -u sherpapp_backend.service -n 200', (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ logs: stdout });
      });
    });
  }
}
