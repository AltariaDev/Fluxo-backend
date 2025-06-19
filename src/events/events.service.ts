// src/events/events.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventsService {
  constructor(private eventEmitter: EventEmitter2) {}

  // Método para emitir eventos
  emitEvent(eventName: string, payload: any) {
    this.eventEmitter.emit(eventName, payload);
  }
}
