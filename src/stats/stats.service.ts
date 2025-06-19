import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Stat } from './entities/stats.entity';
import { StatDocument } from './entities/stats.entity';

@Injectable()
export class StatsService {
  constructor(@InjectModel(Stat.name) private statsModel: Model<StatDocument>) {}

  // Verifica si el documento de estadísticas existe, si no lo crea
  async initializeStats(): Promise<StatDocument> {
    let stats = await this.statsModel.findOne();  // Busca el único documento de Stats

    if (!stats) {
      // Si no existe, crea un documento por defecto
      stats = new this.statsModel({
        completedTasks: 0,
        pendingTasks: 0,
        totalDuration: 0,
        usersOnline: 0,
        usersRegistered: 0,
        activeUsers: 0,
        DAU: 0,
        WAU: 0,
        MAU: 0,
        maxCurrentOnline: 0,
        totalTasks: 0,
        totalHabits: 0,
        totalProfileUpdates: 0,
        MaxCurrentOnlineDate: new Date(),
      });
      await stats.save();  // Guarda el documento en la base de datos
    }

    return stats;
  }

  async updateUsersCount(google?: boolean) {
    const stats = await this.statsModel.findOne();  // Obtiene el único documento de Stats
    if (google) {
      stats.usersRegisteredUsingGoogle++;
    }
    stats.usersRegistered++;
    await stats.save();  // Guarda los cambios
  }
  // Obtiene las estadísticas globales
  async getStats(): Promise<StatDocument> {
    const stats = await this.statsModel.findOne();  // Obtiene el único documento de Stats

    if (!stats) {
      return await this.initializeStats();  // Inicializa si no existe
    }

    return stats;
  }

  // Actualiza las estadísticas
  async updateStats(updateData: Partial<StatDocument>): Promise<StatDocument> {
    const stats = await this.statsModel.findOne();  // Busca el documento de Stats

    if (!stats) {
      return this.initializeStats();  // Si no existe, lo inicializa
    }

    // Actualiza las estadísticas con los datos proporcionados
    Object.assign(stats, updateData);
    stats.lastUpdated = new Date();  // Actualiza la fecha de actualización

    await stats.save();  // Guarda los cambios

    return stats;
  }

  async taskCreated() {
    const stats = await this.statsModel.findOne();
    stats.totalTasks++;
    await stats.save();
  }

  async taskCalendarCreated() {
    const stats = await this.statsModel.findOne();
    stats.totalTasksCalendar++;
    await stats.save();
  }

  async habitCreated() {
    const stats = await this.statsModel.findOne();
    stats.totalHabits++;
    await stats.save();
  }

  async habitCompleted() {
    const stats = await this.statsModel.findOne();
    stats.totalHabitsCompleted++;
    await stats.save();
  }

  async habitDeleted() {
    const stats = await this.statsModel.findOne();
    stats.totalHabitsDeleted++;
    await stats.save();
  }

  async taskCompleted() {
    const stats = await this.statsModel.findOne();
    stats.totalTasksCompleted++;
    await stats.save();
  }
  
  async taskDeleted() {
    const stats = await this.statsModel.findOne();
    stats.totalTasksDeleted++;
    await stats.save();
  }
  
  async pomodoroStarted() {
    const stats = await this.statsModel.findOne();
    stats.totalPomodoros++;
    await stats.save();
  }

  async userDeleted() {
    const stats = await this.statsModel.findOne();
    stats.totalUsersDeleted++;
    await stats.save();
  }

  
  
  
  
  
}
