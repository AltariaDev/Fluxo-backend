import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Reward, RewardDocument } from './entities/reward.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(Reward.name) private readonly rewardModel: Model<RewardDocument>,
  ) {}

  // Retorna todas las Rewards
  async findAll(): Promise<RewardDocument[]> {
    return await this.rewardModel.find();
  }

  // Retorna una Reward por su ID
  async findOne(id: mongoose.Types.ObjectId): Promise<RewardDocument> {
    const reward = await this.rewardModel.findById(id);
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    return reward;
  }

  /**
   * Reclama la reward para un usuario.
   * Esta función simula el proceso de reclamar una recompensa, por ejemplo:
   * - Sumar XP al usuario.
   * - Desbloquear elementos asociados (banner, frame, avatar, etc.).
   * 
   * En una implementación real, esta lógica debería delegarse a un UserService o GamificationService.
   * 
   * @param rewardId Identificador de la reward a reclamar.
   * @param userId Identificador del usuario que reclama la reward.
   * @returns Un objeto con un mensaje y los detalles de la reward.
   */
  async claimReward(rewardId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<{ message: string; reward: Reward }> {
    // Buscamos la reward en la base de datos
    const reward = await this.findOne(rewardId);
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    // Aquí iría la lógica para actualizar el perfil del usuario:
    // Por ejemplo:
    // await this.userService.addXp(userId, reward.xp);
    // await this.userService.unlockItems(userId, {
    //   banner: reward.banner,
    //   frame: reward.frame,
    //   avatar: reward.avatar,
    // });
    // También podrías registrar el evento de "recompensa reclamada" en un historial o emitir una notificación vía WebSocket.

    // Simulamos el proceso devolviendo un mensaje de éxito.
    return {
      message: `Reward claimed successfully! ${reward.xp} XP added to user ${userId}.`,
      reward,
    };
  }
}
