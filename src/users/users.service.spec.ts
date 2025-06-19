import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as mongoose from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;
  let mockEventEmitter: any;

  const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    fullname: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    refreshToken: 'validRefreshToken',
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    mockUserModel = {
      create: jest.fn().mockResolvedValue(mockUser),
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([mockUser]) }),
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
      findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
      findByIdAndDelete: jest.fn().mockResolvedValue(mockUser),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      fullname: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should create a user successfully', async () => {
      const hashedPassword = 'hashedPassword';
      jest.spyOn(argon2, 'hash').mockResolvedValue(hashedPassword);

      const result = await service.create(createUserDto);

      expect(argon2.hash).toHaveBeenCalledWith(createUserDto.password);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException when user already exists', async () => {
      const error = { code: 11000, keyValue: { email: createUserDto.email } };
      mockUserModel.create.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    const userId = new mongoose.Types.ObjectId();

    it('should find a user by ID', async () => {
      const result = await service.findOne(userId.toString());
      expect(result).toEqual(mockUser);
    });

    it('should find a user by email', async () => {
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const result = await service.findOne('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should find a user by username', async () => {
      const username = 'testuser';
      
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockUserModel.findOne
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) }) // email search
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockUser) }); // username search

      const result = await service.findOne(username);

      const findOneCalls = mockUserModel.findOne.mock.calls;
      expect(findOneCalls[0][0]).toEqual({ email: username });
      expect(findOneCalls[1][0]).toEqual({ username: username });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const result = await service.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findOneByRefreshToken', () => {
    it('should find a user by refresh token', async () => {
      const result = await service.findOneByRefreshToken('validRefreshToken');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const result = await service.findOneByRefreshToken('invalidToken');
      expect(result).toBeNull();
    });
  });

  describe('validateRefreshToken', () => {
    const userId = new mongoose.Types.ObjectId();
    const refreshToken = 'validRefreshToken';

    it('should return true for valid refresh token', async () => {
      mockUserModel.findById.mockReturnValue({ 
        exec: jest.fn().mockResolvedValue({ ...mockUser, refreshToken }) 
      });
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      const result = await service.validateRefreshToken(userId, refreshToken);
      expect(result).toBe(true);
    });

    it('should return false when user is not found', async () => {
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const result = await service.validateRefreshToken(userId, refreshToken);
      expect(result).toBe(false);
    });

    it('should return false when refresh token is null', async () => {
      mockUserModel.findById.mockReturnValue({ 
        exec: jest.fn().mockResolvedValue({ ...mockUser, refreshToken: null }) 
      });
      const result = await service.validateRefreshToken(userId, refreshToken);
      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    const userId = new mongoose.Types.ObjectId();
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
      password: 'oldpassword',
      updatedPassword: 'newpassword',
    };

    it('should update a user successfully', async () => {
      const hashedNewPassword = 'newHashedPassword';
      const updatedUser = { 
        ...mockUser, 
        email: updateUserDto.email,
        password: hashedNewPassword 
      };

      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      mockUserModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updatedUser) });
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      jest.spyOn(argon2, 'hash').mockResolvedValue(hashedNewPassword);

      const result = await service.update(userId.toString(), updateUserDto);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId.toString());
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId.toString(),
        { ...updateUserDto, password: hashedNewPassword },
        { new: true }
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw BadRequestException when password is required but not provided', async () => {
      const updateWithoutPassword = { ...updateUserDto, password: undefined };
      await expect(service.update(userId.toString(), updateWithoutPassword)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update(userId.toString(), updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when current password is invalid', async () => {
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);
      await expect(service.update(userId.toString(), updateUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const userId = new mongoose.Types.ObjectId();

    it('should remove a user successfully', async () => {
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);

      const result = await service.remove(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException when user is not found', async () => {
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove(userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when id is invalid', async () => {
      const invalidId = 'invalid-id';
      await expect(service.remove(invalidId as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePassword', () => {
    const email = 'test@example.com';
    const hashedPassword = 'hashedNewPassword';

    it('should update password successfully', async () => {
      const mockUserWithSave = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(mockUser),
      };
      
      mockUserModel.findOne.mockReturnValue({ 
        exec: jest.fn().mockResolvedValue(mockUserWithSave)
      });

      const result = await service.updatePassword(email, hashedPassword);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(mockUserWithSave.password).toBe(hashedPassword);
      expect(mockUserWithSave.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Password updated successfully' });
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.updatePassword(email, hashedPassword)).rejects.toThrow(NotFoundException);
    });
  });
}); 