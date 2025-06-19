import { Test, TestingModule } from '@nestjs/testing';
import { HabitsService } from './habits.service';
import { getModelToken } from '@nestjs/mongoose';
import { Habit, HabitDocument } from './entities/habit.entity';
import { Model } from 'mongoose';
import { NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import mongoose from 'mongoose';

describe('HabitsService', () => {
  let service: HabitsService;
  let model: Model<HabitDocument>;

  const mockHabitModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockUserId = new mongoose.Types.ObjectId();
  const mockHabitId = new mongoose.Types.ObjectId();

  const mockHabit: Partial<HabitDocument> = {
    _id: mockHabitId,
    name: 'Test Habit',
    description: 'Test Description',
    type: 'health',
    frequency: 'daily',
    status: false,
    streak: 0,
    bestStreak: 0,
    userId: mockUserId,
    completedDates: [],
    lastCompletedDate: null,
    populate: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitsService,
        {
          provide: getModelToken(Habit.name),
          useValue: mockHabitModel,
        },
      ],
    }).compile();

    service = module.get<HabitsService>(HabitsService);
    model = module.get<Model<HabitDocument>>(getModelToken(Habit.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createHabitDto: CreateHabitDto = {
      name: 'New Habit',
      description: 'New Description',
      type: 'productivity',
      frequency: 'daily',
    };

    it('should create a new habit', async () => {
      mockHabitModel.create.mockResolvedValue(mockHabit);

      const result = await service.create(createHabitDto, mockUserId);

      expect(mockHabitModel.create).toHaveBeenCalledWith({
        ...createHabitDto,
        userId: mockUserId,
        streak: 0,
        bestStreak: 0,
      });
      expect(result).toEqual(mockHabit);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockHabitModel.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createHabitDto, mockUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all habits for a user', async () => {
      const mockHabits = [mockHabit];
      mockHabitModel.find.mockResolvedValue(mockHabits);

      const result = await service.findAll(mockUserId);

      expect(mockHabitModel.find).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result).toEqual(mockHabits);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockHabitModel.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll(mockUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a habit by id', async () => {
      mockHabitModel.findById.mockResolvedValue(mockHabit);

      const result = await service.findOne(mockHabitId, mockUserId);

      expect(mockHabitModel.findById).toHaveBeenCalledWith(mockHabitId);
      expect(result).toEqual(mockHabit);
    });

    it('should throw NotFoundException if habit not found', async () => {
      mockHabitModel.findById.mockResolvedValue(null);

      await expect(service.findOne(mockHabitId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if user does not own the habit', async () => {
      const differentUserId = new mongoose.Types.ObjectId();
      mockHabitModel.findById.mockResolvedValue(mockHabit);

      await expect(service.findOne(mockHabitId, differentUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('update', () => {
    const updateHabitDto: UpdateHabitDto = {
      name: 'Updated Habit',
      status: true,
    };

    it('should update a habit', async () => {
      mockHabitModel.findById.mockResolvedValue(mockHabit);
      mockHabitModel.findByIdAndUpdate.mockResolvedValue({
        ...mockHabit,
        ...updateHabitDto,
      });

      const result = await service.update(mockHabitId, updateHabitDto, mockUserId);

      expect(mockHabitModel.findById).toHaveBeenCalledWith(mockHabitId);
      expect(mockHabitModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should increment streak when marking habit as completed', async () => {
      const habitWithLastCompleted = {
        ...mockHabit,
        lastCompletedDate: new Date(Date.now() - 86400000), // yesterday
        status: false,
      };
      
      mockHabitModel.findById.mockResolvedValue(habitWithLastCompleted);
      mockHabitModel.findByIdAndUpdate.mockResolvedValue({
        ...habitWithLastCompleted,
        status: true,
        streak: 1,
      });

      const result = await service.update(mockHabitId, { status: true }, mockUserId);

      expect(result.streak).toBe(1);
    });

    it('should throw NotFoundException if habit not found', async () => {
      mockHabitModel.findById.mockResolvedValue(null);

      await expect(service.update(mockHabitId, updateHabitDto, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if user does not own the habit', async () => {
      const differentUserId = new mongoose.Types.ObjectId();
      mockHabitModel.findById.mockResolvedValue(mockHabit);

      await expect(service.update(mockHabitId, updateHabitDto, differentUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a habit', async () => {
      mockHabitModel.findById.mockResolvedValue(mockHabit);
      mockHabitModel.findByIdAndDelete.mockResolvedValue(mockHabit);

      const result = await service.remove(mockHabitId, mockUserId);

      expect(mockHabitModel.findById).toHaveBeenCalledWith(mockHabitId);
      expect(mockHabitModel.findByIdAndDelete).toHaveBeenCalledWith(mockHabitId);
      expect(result).toEqual(mockHabit);
    });

    it('should throw NotFoundException if habit not found', async () => {
      mockHabitModel.findById.mockResolvedValue(null);

      await expect(service.remove(mockHabitId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if user does not own the habit', async () => {
      const differentUserId = new mongoose.Types.ObjectId();
      mockHabitModel.findById.mockResolvedValue(mockHabit);

      await expect(service.remove(mockHabitId, differentUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('checkHabits', () => {
    it('should reset daily habits not completed today', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const dailyHabit = {
        ...mockHabit,
        frequency: 'daily',
        lastCompletedDate: yesterday,
        status: true,
      };
      
      mockHabitModel.find.mockResolvedValue([dailyHabit]);
      mockHabitModel.findByIdAndUpdate.mockResolvedValue({
        ...dailyHabit,
        status: false,
      });

      const result = await service.checkHabits(mockUserId);

      expect(mockHabitModel.findByIdAndUpdate).toHaveBeenCalledWith(
        dailyHabit._id,
        { $set: { status: false } },
      );
      expect(result).toHaveLength(1);
    });

    it('should reset weekly habits not completed this week', async () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 8);
      
      const weeklyHabit = {
        ...mockHabit,
        frequency: 'weekly',
        lastCompletedDate: lastWeek,
        status: true,
      };
      
      mockHabitModel.find.mockResolvedValue([weeklyHabit]);
      mockHabitModel.findByIdAndUpdate.mockResolvedValue({
        ...weeklyHabit,
        status: false,
      });

      const result = await service.checkHabits(mockUserId);

      expect(mockHabitModel.findByIdAndUpdate).toHaveBeenCalledWith(
        weeklyHabit._id,
        { $set: { status: false } },
      );
      expect(result).toHaveLength(1);
    });

    it('should reset monthly habits not completed this month', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const monthlyHabit = {
        ...mockHabit,
        frequency: 'monthly',
        lastCompletedDate: lastMonth,
        status: true,
      };
      
      mockHabitModel.find.mockResolvedValue([monthlyHabit]);
      mockHabitModel.findByIdAndUpdate.mockResolvedValue({
        ...monthlyHabit,
        status: false,
      });

      const result = await service.checkHabits(mockUserId);

      expect(mockHabitModel.findByIdAndUpdate).toHaveBeenCalledWith(
        monthlyHabit._id,
        { $set: { status: false } },
      );
      expect(result).toHaveLength(1);
    });
  });
}); 