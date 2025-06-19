
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { differenceInSeconds, endOfDay, endOfWeek, endOfMonth, endOfYear } from 'date-fns';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisherClient: Redis;
  private subscriberClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  async onModuleInit() {
    // Configura la conexión usando variables de entorno si las tienes, o valores por defecto.
    this.publisherClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD, // si es necesario
    });

    // Duplicamos la conexión para suscripción (pub/sub)
    this.subscriberClient = this.publisherClient.duplicate();

    // Manejo de eventos para publisher
    this.publisherClient.on('connect', () => {
      this.logger.log('✅ Connected to Redis (publisher)');
    });

    this.publisherClient.on('error', (err) => {
      this.logger.error('❌ Redis error (publisher):', err);
    });

    // Manejo de eventos para subscriber
    this.subscriberClient.on('connect', () => {
      this.logger.log('✅ Connected to Redis (subscriber)');
    });

    this.subscriberClient.on('error', (err) => {
      this.logger.error('❌ Redis error (subscriber):', err);
    });

    // Si deseas suscribirte a un canal en el arranque, por ejemplo para eventos de gamificación:
    // this.subscribe('gamification', (message, channel) => {
    //   this.logger.log(`Received message on ${channel}: ${message}`);
    // });
  }

  async onModuleDestroy() {
    await this.publisherClient.quit();
    await this.subscriberClient.quit();
  }

  // ===============================
  // Métodos básicos de cacheo (set, get, delete)
  // ===============================
  async setValue(key: string, value: string, expireSeconds?: number): Promise<void> {
    await this.publisherClient.set(key, value);
    if (expireSeconds) {
      await this.publisherClient.expire(key, expireSeconds);
    }
  }

  async getValue(key: string): Promise<string | null> {
    return this.publisherClient.get(key);
  }

  async deleteKey(key: string): Promise<number> {
    return this.publisherClient.del(key);
  }

  // ===============================
  // Métodos para Pub/Sub
  // ===============================
  async publish(channel: string, message: string): Promise<number> {
    // Publica un mensaje en el canal indicado
    return this.publisherClient.publish(channel, message);
  }

  subscribe(channel: string, callback: (message: string, channel: string) => void): void {
    // Suscribe al canal; cualquier mensaje publicado en él invocará el callback
    this.subscriberClient.subscribe(channel, (err, count) => {
      if (err) {
        this.logger.error(`Error subscribing to channel ${channel}:`, err);
      } else {
        this.logger.log(`Subscribed to channel ${channel}. Total subscriptions: ${count}`);
      }
    });

    // Escucha los mensajes del canal
    this.subscriberClient.on('message', (chan, message) => {
      if (chan === channel) {
        callback(message, chan);
      }
    });
  }
  
  // ===============================
  // Ejemplo de Pipeline (para operaciones múltiples de forma atómica)
  // ===============================
  async executePipeline(commands: Array<[string, ...any[]]>): Promise<any> {
    const pipeline = this.publisherClient.pipeline();
    commands.forEach((command) => {
      pipeline[command[0]](...command.slice(1));
    });
    return pipeline.exec();
  }

// ================================================
  // Métodos para Leaderboard "Actual" sin Historial
  // Claves fijas con TTL para reiniciar el ranking al finalizar el período
  // ================================================

  /**
   * Calcula el TTL en segundos hasta el final del día, semana, mes o año.
   */
  private calculateTTL(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): number {
    const now = new Date();
    let end: Date;
    switch (period) {
      case 'daily':
        end = endOfDay(now);
        break;
      case 'weekly':
        // endOfWeek: por defecto considera domingo como final de semana,
        // si deseas la semana ISO (fin del domingo) puedes usar las opciones según convenga.
        end = endOfWeek(now, { weekStartsOn: 1 }); // Por ejemplo, semana que inicia el lunes.
        break;
      case 'monthly':
        end = endOfMonth(now);
        break;
      case 'yearly':
        end = endOfYear(now);
        break;
      default:
        throw new Error('Periodo no soportado');
    }
    return differenceInSeconds(end, now);
  }

  /**
   * Actualiza la puntuación del usuario en los leaderboards actuales (día, semana, mes, año).
   * Utiliza claves fijas y establece un TTL para que se reinicien al finalizar el período.
   * @param userId Identificador del usuario.
   * @param score Puntuación a sumar (o restar si es negativa).
   */
  async addScoreToCurrentPeriods(userId: string, score: number): Promise<void> {
    // Definir claves fijas
    const dailyKey = 'leaderboard:daily';
    const weeklyKey = 'leaderboard:weekly';
    const monthlyKey = 'leaderboard:monthly';
    const yearlyKey = 'leaderboard:yearly';

    // Calcular TTL para cada período
    const ttlDaily = this.calculateTTL('daily');
    const ttlWeekly = this.calculateTTL('weekly');
    const ttlMonthly = this.calculateTTL('monthly');
    const ttlYearly = this.calculateTTL('yearly');

    const pipeline = this.publisherClient.pipeline();

    // Incrementar la puntuación en cada sorted set
    pipeline.zincrby(dailyKey, score, userId);
    pipeline.zincrby(weeklyKey, score, userId);
    pipeline.zincrby(monthlyKey, score, userId);
    pipeline.zincrby(yearlyKey, score, userId);

    // Establecer el TTL en cada clave (se reiniciará el ranking al expirar la clave)
    pipeline.expire(dailyKey, ttlDaily);
    pipeline.expire(weeklyKey, ttlWeekly);
    pipeline.expire(monthlyKey, ttlMonthly);
    pipeline.expire(yearlyKey, ttlYearly);

    await pipeline.exec();
  }

  /**
   * Obtiene el leaderboard para un período actual.
   * @param period 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param start Índice inicial (default: 0)
   * @param stop Índice final (default: 9)
   * @returns Array de objetos con userId y score.
   */
  async getCurrentLeaderboard(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    start = 0,
    stop = 9,
  ): Promise<Array<{ userId: string; score: number }>> {
    let key: string;
    switch (period) {
      case 'daily':
        key = 'leaderboard:daily';
        break;
      case 'weekly':
        key = 'leaderboard:weekly';
        break;
      case 'monthly':
        key = 'leaderboard:monthly';
        break;
      case 'yearly':
        key = 'leaderboard:yearly';
        break;
      default:
        throw new Error('Periodo no soportado');
    }

    const result = await this.publisherClient.zrevrange(key, start, stop, 'WITHSCORES');
    const leaderboard = [];
    for (let i = 0; i < result.length; i += 2) {
      leaderboard.push({
        userId: result[i],
        score: parseFloat(result[i + 1]),
      });
    }
    return leaderboard;
  }

  /**
   * Obtiene la puntuación de un usuario en el leaderboard del período actual.
   * @param period 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param userId Identificador del usuario.
   * @returns La puntuación o null.
   */
  async getCurrentUserScore(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    userId: string,
  ): Promise<number | null> {
    let key: string;
    switch (period) {
      case 'daily':
        key = 'leaderboard:daily';
        break;
      case 'weekly':
        key = 'leaderboard:weekly';
        break;
      case 'monthly':
        key = 'leaderboard:monthly';
        break;
      case 'yearly':
        key = 'leaderboard:yearly';
        break;
      default:
        throw new Error('Periodo no soportado');
    }
    const score = await this.publisherClient.zscore(key, userId);
    return score ? parseFloat(score) : null;
  }
}