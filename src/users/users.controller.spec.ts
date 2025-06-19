import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserDocument, User } from './entities/user.entity';
import { Document } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

// Mock the IS_PUBLIC_KEY
jest.mock('src/auth/decorators/public.decorator', () => ({
  IS_PUBLIC_KEY: 'isPublic',
}));

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let validationPipe: ValidationPipe;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    mockUsersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
    } as any;

    mockReflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as any;

    validationPipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      fullname: 'Test User',
      password: 'password123',
      birthDate: new Date('1990-01-01'),
    };

    it('should create a new user', async () => {
      const mockUser = {
        _id: 'mockId',
        email: 'test@example.com',
        username: 'testuser',
        fullname: 'Test User',
        password: 'hashedPassword',
        birthDate: new Date(),
        refreshToken: null,
        stripeCustomerId: null,
        resetCode: null,
        __v: 0,
        $assertPopulated: jest.fn(),
        $clearModifiedPaths: jest.fn(),
        db: {
          aggregate: jest.fn(),
          asPromise: jest.fn(),
          close: jest.fn(),
          destroy: jest.fn(),
          collection: jest.fn(),
          createCollection: jest.fn(),
          dropCollection: jest.fn(),
          dropDatabase: jest.fn(),
          listCollections: jest.fn(),
          model: jest.fn(),
          modelNames: jest.fn(),
          plugin: jest.fn(),
          startSession: jest.fn(),
          transaction: jest.fn(),
          useDb: jest.fn(),
          watch: jest.fn()
        }
      } as any;

      mockUsersService.create.mockResolvedValue(mockUser);

      const result1 = await controller.create(createUserDto);

      expect(result1).toEqual(mockUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw BadRequestException when user creation fails', async () => {
      mockUsersService.create.mockRejectedValue(new BadRequestException('User already exists'));

      await expect(controller.create(createUserDto)).rejects.toThrow(BadRequestException);
    });

    // DTO Validation Tests
    it('should reject invalid CreateUserDto with missing required fields', async () => {
      const invalidDto = {
        email: 'test@example.com',
        // missing username, fullname, password, birthDate
      };

      await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: CreateUserDto }))
        .rejects.toThrow();
    });

    it('should reject CreateUserDto with extra unexpected fields', async () => {
      const invalidDto = {
        ...createUserDto,
        extraField: 'this should be rejected',
      };

      await expect(validationPipe.transform(invalidDto, { type: 'body', metatype: CreateUserDto }))
        .rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockCollection = {
        dbName: 'test',
        hint: jest.fn(),
        timeoutMS: 30000,
        createIndexes: jest.fn(),
        $format: jest.fn(),
        $print: jest.fn(),
        getIndexes: jest.fn(),
        ensureIndex: jest.fn(),
        dropIndex: jest.fn(),
        dropIndexes: jest.fn(),
        createIndex: jest.fn(),
        listIndexes: jest.fn(),
        indexExists: jest.fn(),
        indexInformation: jest.fn(),
        initializeOrderedBulkOp: jest.fn(),
        initializeUnorderedBulkOp: jest.fn(),
        insert: jest.fn(),
        insertOne: jest.fn(),
        insertMany: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        updateOne: jest.fn(),
        updateMany: jest.fn(),
        remove: jest.fn(),
        deleteOne: jest.fn(),
        deleteMany: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
        findOneAndReplace: jest.fn(),
        aggregate: jest.fn(),
        bulkWrite: jest.fn(),
        count: jest.fn(),
        countDocuments: jest.fn(),
        estimatedDocumentCount: jest.fn(),
        distinct: jest.fn(),
        drop: jest.fn(),
        isCapped: jest.fn(),
        options: jest.fn(),
        rename: jest.fn(),
        stats: jest.fn(),
        watch: jest.fn(),
        mapReduce: jest.fn(),
        geoHaystackSearch: jest.fn(),
        indexes: jest.fn(),
        parallelCollectionScan: jest.fn(),
        replaceOne: jest.fn(),
        findAndModify: jest.fn(),
        listSearchIndexes: jest.fn(),
        createSearchIndex: jest.fn(),
        createSearchIndexes: jest.fn(),
        dropSearchIndex: jest.fn(),
        updateSearchIndex: jest.fn(),
        collectionName: 'users',
        conn: {
          aggregate: jest.fn(),
          asPromise: jest.fn(),
          close: jest.fn(),
          destroy: jest.fn(),
          collection: jest.fn(),
          createCollection: jest.fn(),
          dropCollection: jest.fn(),
          dropDatabase: jest.fn(),
          listCollections: jest.fn(),
          model: jest.fn(),
          modelNames: jest.fn(),
          plugin: jest.fn(),
          startSession: jest.fn(),
          transaction: jest.fn(),
          useDb: jest.fn(),
          watch: jest.fn(),
          host: 'localhost',
          port: 27017,
          name: 'test',
          options: {},
          config: {},
          db: {
            databaseName: 'test',
            options: {},
            secondaryOk: false,
            readConcern: {
              level: 'local',
              toJSON: jest.fn(),
              severity: 1
            },
            writeConcern: {
              w: 1,
              j: true,
              wtimeout: 0,
              toJSON: jest.fn()
            },
            readPreference: {
              mode: 'primary' as const,
              tags: [],
              hedge: {},
              maxStalenessSeconds: 0,
              minWireVersion: 0,
              toJSON: jest.fn(),
              preference: 'primary' as const,
              isValid: jest.fn(() => true),
              secondaryOk: false,
              equals: jest.fn(),
              severity: 1
            },
            namespace: {},
            bufferMaxEntries: 0,
            command: jest.fn(),
            createCollection: jest.fn(),
            createIndex: jest.fn(),
            dropCollection: jest.fn(),
            dropDatabase: jest.fn(),
            executeDbAdminCommand: jest.fn(),
            indexInformation: jest.fn(),
            listCollections: jest.fn(),
            profilingLevel: jest.fn(),
            removeUser: jest.fn(),
            renameCollection: jest.fn(),
            setProfilingLevel: jest.fn(),
            stats: jest.fn(),
            admin: jest.fn(),
            collection: jest.fn(),
            collections: jest.fn(),
            eval: jest.fn(),
            addUser: jest.fn()
          },
          id: 1,
          models: {},
          collections: {},
          replica: false,
          states: {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
            99: 'uninitialized'
          },
          on: jest.fn(),
          once: jest.fn(),
          emit: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          removeAllListeners: jest.fn(),
          setMaxListeners: jest.fn(),
          getMaxListeners: jest.fn(),
          listeners: jest.fn(),
          rawListeners: jest.fn(),
          listenerCount: jest.fn(),
          prependListener: jest.fn(),
          prependOnceListener: jest.fn(),
          eventNames: jest.fn()
        },
        name: 'users',
        namespace: 'test.users',
        writeConcern: { w: 1 },
        readConcern: { level: 'local' },
        readPreference: { mode: 'primary' },
        bsonOptions: {},
        pkFactory: { createPk: jest.fn() },
        promiseLibrary: Promise,
        serializeFunctions: false,
        strict: true,
        capped: false,
        size: 0,
        max: 0,
        autoIndexId: true,
        raw: false,
        bufferMaxEntries: 0,
        baseModelName: 'User',
        modelName: 'User',
        schema: {},
        db: {
          databaseName: 'test',
          options: {},
          secondaryOk: false,
          readConcern: {
            level: 'local',
            toJSON: jest.fn(),
            severity: 1
          },
          writeConcern: {
            w: 1,
            j: true,
            wtimeout: 0,
            toJSON: jest.fn()
          },
          readPreference: {
            mode: 'primary' as const,
            tags: [],
            hedge: {},
            maxStalenessSeconds: 0,
            minWireVersion: 0,
            toJSON: jest.fn(),
            preference: 'primary' as const,
            isValid: jest.fn(() => true),
            secondaryOk: false,
            equals: jest.fn(),
            severity: 1
          },
          namespace: {},
          bufferMaxEntries: 0,
          command: jest.fn(),
          createCollection: jest.fn(),
          createIndex: jest.fn(),
          dropCollection: jest.fn(),
          dropDatabase: jest.fn(),
          executeDbAdminCommand: jest.fn(),
          indexInformation: jest.fn(),
          listCollections: jest.fn(),
          profilingLevel: jest.fn(),
          removeUser: jest.fn(),
          renameCollection: jest.fn(),
          setProfilingLevel: jest.fn(),
          stats: jest.fn(),
          admin: jest.fn(),
          collection: jest.fn(),
          collections: jest.fn(),
          eval: jest.fn(),
          addUser: jest.fn()
        }
      } as any;

      const expectedUsers = [
        { 
          _id: 'user1', 
          email: 'user1@example.com',
          username: 'user1',
          fullname: 'User One',
          password: 'hashedpass1',
          birthDate: new Date(),
          refreshToken: null,
          stripeCustomerId: null,
          resetCode: null,
          __v: 0,
          $assertPopulated: jest.fn(),
          $clearModifiedPaths: jest.fn(),
          $clone: jest.fn(),
          $getAllSubdocs: jest.fn(),
          $ignore: jest.fn(),
          $isDefault: jest.fn(),
          $isDeleted: jest.fn(),
          $isEmpty: jest.fn(),
          $isValid: jest.fn(),
          $locals: {},
          $markValid: jest.fn(),
          $model: jest.fn(),
          $op: null,
          $session: jest.fn(),
          $set: jest.fn(),
          collection: mockCollection,
          db: {},
          delete: jest.fn(),
          deleteOne: jest.fn(),
          depopulate: jest.fn(),
          directModifiedPaths: jest.fn(),
          equals: jest.fn(),
          errors: {},
          get: jest.fn(),
          getChanges: jest.fn(),
          increment: jest.fn(),
          init: jest.fn(),
          invalidate: jest.fn(),
          isDirectModified: jest.fn(),
          isDirectSelected: jest.fn(),
          isInit: jest.fn(),
          isModified: jest.fn(),
          isNew: false,
          isSelected: jest.fn(),
          markModified: jest.fn(),
          modifiedPaths: jest.fn(),
          overwrite: jest.fn(),
          populate: jest.fn(),
          populated: jest.fn(),
          remove: jest.fn(),
          replaceOne: jest.fn(),
          save: jest.fn(),
          schema: {},
          set: jest.fn(),
          toJSON: jest.fn(),
          toObject: jest.fn(),
          unmarkModified: jest.fn(),
          update: jest.fn(),
          updateOne: jest.fn(),
          validate: jest.fn(),
          validateSync: jest.fn(),
          $createModifiedPathsSnapshot: jest.fn(),
          $getPopulatedDocs: jest.fn(),
          $inc: jest.fn(),
          $restoreModifiedPathsSnapshot: jest.fn(),
          $parent: jest.fn(),
          $__: jest.fn(),
          $where: {},
          model: jest.fn(),
        },
        { 
          _id: 'user2', 
          email: 'user2@example.com',
          username: 'user2',
          fullname: 'User Two',
          password: 'hashedpass2',
          birthDate: new Date(),
          refreshToken: null,
          stripeCustomerId: null,
          resetCode: null,
          __v: 0,
          $assertPopulated: jest.fn(),
          $clearModifiedPaths: jest.fn(),
          $clone: jest.fn(),
          $getAllSubdocs: jest.fn(),
          $ignore: jest.fn(),
          $isDefault: jest.fn(),
          $isDeleted: jest.fn(),
          $isEmpty: jest.fn(),
          $isValid: jest.fn(),
          $locals: {},
          $markValid: jest.fn(),
          $model: jest.fn(),
          $op: null,
          $session: jest.fn(),
          $set: jest.fn(),
          collection: mockCollection,
          db: {},
          delete: jest.fn(),
          deleteOne: jest.fn(),
          depopulate: jest.fn(),
          directModifiedPaths: jest.fn(),
          equals: jest.fn(),
          errors: {},
          get: jest.fn(),
          getChanges: jest.fn(),
          increment: jest.fn(),
          init: jest.fn(),
          invalidate: jest.fn(),
          isDirectModified: jest.fn(),
          isDirectSelected: jest.fn(),
          isInit: jest.fn(),
          isModified: jest.fn(),
          isNew: false,
          isSelected: jest.fn(),
          markModified: jest.fn(),
          modifiedPaths: jest.fn(),
          overwrite: jest.fn(),
          populate: jest.fn(),
          populated: jest.fn(),
          remove: jest.fn(),
          replaceOne: jest.fn(),
          save: jest.fn(),
          schema: {},
          set: jest.fn(),
          toJSON: jest.fn(),
          toObject: jest.fn(),
          unmarkModified: jest.fn(),
          update: jest.fn(),
          updateOne: jest.fn(),
          validate: jest.fn(),
          validateSync: jest.fn(),
          $createModifiedPathsSnapshot: jest.fn(),
          $getPopulatedDocs: jest.fn(),
          $inc: jest.fn(),
          $restoreModifiedPathsSnapshot: jest.fn(),
          $parent: jest.fn(),
          $__: jest.fn(),
          $where: {},
          model: jest.fn(),
        },
      ];

      mockUsersService.findAll.mockResolvedValue(expectedUsers as unknown as (Document<unknown, {}, UserDocument> & UserDocument & Document<unknown, any, any> & Required<{ _id: unknown; }> & { __v: number; })[]);

      const result3 = await controller.findAll();

      expect(result3).toEqual(expectedUsers);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const userId = new Types.ObjectId().toString();
    const email = 'test@example.com';
    const username = 'testuser';

    it('should return a user by id', async () => {
      const mockCollection = {
        dbName: 'test',
        hint: jest.fn(),
        timeoutMS: 30000,
        createIndexes: jest.fn(),
        $format: jest.fn(),
        $print: jest.fn(),
        getIndexes: jest.fn(),
        ensureIndex: jest.fn(),
        dropIndex: jest.fn(),
        dropIndexes: jest.fn(),
        createIndex: jest.fn(),
        listIndexes: jest.fn(),
        indexExists: jest.fn(),
        indexInformation: jest.fn(),
        initializeOrderedBulkOp: jest.fn(),
        initializeUnorderedBulkOp: jest.fn(),
        insert: jest.fn(),
        insertOne: jest.fn(),
        insertMany: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        updateOne: jest.fn(),
        updateMany: jest.fn(),
        remove: jest.fn(),
        deleteOne: jest.fn(),
        deleteMany: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
        findOneAndReplace: jest.fn(),
        aggregate: jest.fn(),
        bulkWrite: jest.fn(),
        count: jest.fn(),
        countDocuments: jest.fn(),
        estimatedDocumentCount: jest.fn(),
        distinct: jest.fn(),
        drop: jest.fn(),
        isCapped: jest.fn(),
        options: jest.fn(),
        rename: jest.fn(),
        stats: jest.fn(),
        watch: jest.fn(),
        mapReduce: jest.fn(),
        geoHaystackSearch: jest.fn(),
        indexes: jest.fn(),
        parallelCollectionScan: jest.fn(),
        replaceOne: jest.fn(),
        findAndModify: jest.fn(),
        listSearchIndexes: jest.fn(),
        createSearchIndex: jest.fn(),
        createSearchIndexes: jest.fn(),
        dropSearchIndex: jest.fn(),
        updateSearchIndex: jest.fn(),
        collectionName: 'users',
        conn: {
          aggregate: jest.fn(),
          asPromise: jest.fn(),
          close: jest.fn(),
          destroy: jest.fn(),
          collection: jest.fn(),
          createCollection: jest.fn(),
          dropCollection: jest.fn(),
          dropDatabase: jest.fn(),
          listCollections: jest.fn(),
          model: jest.fn(),
          modelNames: jest.fn(),
          plugin: jest.fn(),
          startSession: jest.fn(),
          transaction: jest.fn(),
          useDb: jest.fn(),
          watch: jest.fn(),
          host: 'localhost',
          port: 27017,
          name: 'test',
          options: {},
          config: {},
          db: {
            databaseName: 'test',
            options: {},
            secondaryOk: false,
            readConcern: {
              level: 'local',
              toJSON: jest.fn(),
              severity: 1
            },
            writeConcern: {
              w: 1,
              j: true,
              wtimeout: 0,
              toJSON: jest.fn()
            },
            readPreference: {
              mode: 'primary' as const,
              tags: [],
              hedge: {},
              maxStalenessSeconds: 0,
              minWireVersion: 0,
              toJSON: jest.fn(),
              preference: 'primary' as const,
              isValid: jest.fn(() => true),
              secondaryOk: false,
              equals: jest.fn(),
              severity: 1
            },
            namespace: {},
            bufferMaxEntries: 0,
            command: jest.fn(),
            createCollection: jest.fn(),
            createIndex: jest.fn(),
            dropCollection: jest.fn(),
            dropDatabase: jest.fn(),
            executeDbAdminCommand: jest.fn(),
            indexInformation: jest.fn(),
            listCollections: jest.fn(),
            profilingLevel: jest.fn(),
            removeUser: jest.fn(),
            renameCollection: jest.fn(),
            setProfilingLevel: jest.fn(),
            stats: jest.fn(),
            admin: jest.fn(),
            collection: jest.fn(),
            collections: jest.fn(),
            eval: jest.fn(),
            addUser: jest.fn()
          },
          id: 1,
          models: {},
          collections: {},
          replica: false,
          states: {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
            99: 'uninitialized'
          },
          on: jest.fn(),
          once: jest.fn(),
          emit: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          removeAllListeners: jest.fn(),
          setMaxListeners: jest.fn(),
          getMaxListeners: jest.fn(),
          listeners: jest.fn(),
          rawListeners: jest.fn(),
          listenerCount: jest.fn(),
          prependListener: jest.fn(),
          prependOnceListener: jest.fn(),
          eventNames: jest.fn()
        },
        name: 'users',
        namespace: 'test.users',
        writeConcern: { w: 1 },
        readConcern: { level: 'local' },
        readPreference: { mode: 'primary' },
        bsonOptions: {},
        pkFactory: { createPk: jest.fn() },
        promiseLibrary: Promise,
        serializeFunctions: false,
        strict: true,
        capped: false,
        size: 0,
        max: 0,
        autoIndexId: true,
        raw: false,
        bufferMaxEntries: 0,
        baseModelName: 'User',
        modelName: 'User',
        schema: {},
        db: {
          databaseName: 'test',
          options: {},
          secondaryOk: false,
          readConcern: {
            level: 'local',
            toJSON: jest.fn(),
            severity: 1
          },
          writeConcern: {
            w: 1,
            j: true,
            wtimeout: 0,
            toJSON: jest.fn()
          },
          readPreference: {
            mode: 'primary' as const,
            tags: [],
            hedge: {},
            maxStalenessSeconds: 0,
            minWireVersion: 0,
            toJSON: jest.fn(),
            preference: 'primary' as const,
            isValid: jest.fn(() => true),
            secondaryOk: false,
            equals: jest.fn(),
            severity: 1
          },
          namespace: {},
          bufferMaxEntries: 0,
          command: jest.fn(),
          createCollection: jest.fn(),
          createIndex: jest.fn(),
          dropCollection: jest.fn(),
          dropDatabase: jest.fn(),
          executeDbAdminCommand: jest.fn(),
          indexInformation: jest.fn(),
          listCollections: jest.fn(),
          profilingLevel: jest.fn(),
          removeUser: jest.fn(),
          renameCollection: jest.fn(),
          setProfilingLevel: jest.fn(),
          stats: jest.fn(),
          admin: jest.fn(),
          collection: jest.fn(),
          collections: jest.fn(),
          eval: jest.fn(),
          addUser: jest.fn()
        }
      } as any;

      const expectedUser = { 
        _id: userId, 
        email: 'test@example.com',
        username: 'testuser',
        fullname: 'Test User',
        password: 'hashedpass',
        birthDate: new Date(),
        refreshToken: null,
        stripeCustomerId: null,
        resetCode: null,
        __v: 0,
        $assertPopulated: jest.fn(),
        $clearModifiedPaths: jest.fn(),
        $clone: jest.fn(),
        $getAllSubdocs: jest.fn(),
        $ignore: jest.fn(),
        $isDefault: jest.fn(),
        $isDeleted: jest.fn(),
        $isEmpty: jest.fn(),
        $isValid: jest.fn(),
        $locals: {},
        $markValid: jest.fn(),
        $model: jest.fn(),
        $op: null,
        $session: jest.fn(),
        $set: jest.fn(),
        collection: mockCollection,
        db: {},
        delete: jest.fn(),
        deleteOne: jest.fn(),
        depopulate: jest.fn(),
        directModifiedPaths: jest.fn(),
        equals: jest.fn(),
        errors: {},
        get: jest.fn(),
        getChanges: jest.fn(),
        increment: jest.fn(),
        init: jest.fn(),
        invalidate: jest.fn(),
        isDirectModified: jest.fn(),
        isDirectSelected: jest.fn(),
        isInit: jest.fn(),
        isModified: jest.fn(),
        isNew: false,
        isSelected: jest.fn(),
        markModified: jest.fn(),
        modifiedPaths: jest.fn(),
        overwrite: jest.fn(),
        populate: jest.fn(),
        populated: jest.fn(),
        remove: jest.fn(),
        replaceOne: jest.fn(),
        save: jest.fn(),
        schema: {},
        set: jest.fn(),
        toJSON: jest.fn(),
        toObject: jest.fn(),
        unmarkModified: jest.fn(),
        update: jest.fn(),
        updateOne: jest.fn(),
        validate: jest.fn(),
        validateSync: jest.fn(),
        $createModifiedPathsSnapshot: jest.fn(),
        $getPopulatedDocs: jest.fn(),
        $inc: jest.fn(),
        $restoreModifiedPathsSnapshot: jest.fn(),
        $parent: jest.fn(),
        $__: jest.fn(),
        $where: {},
        model: jest.fn(),
      };

      mockUsersService.findOne.mockResolvedValue(expectedUser as unknown as UserDocument);

      const result4 = await controller.findOne(userId);

      expect(result4).toEqual(expectedUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(userId);
      
      expect(result).toBeNull();
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
    });

    // Multi-Case Lookup Tests
    it('should find a user by email', async () => {
      const userByEmail = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        fullname: 'Test User',
        password: 'hashedpass',
        birthDate: new Date(),
        refreshToken: null,
        stripeCustomerId: null,
        resetCode: null,
        __v: 0,
      } as any;

      mockUsersService.findOne.mockResolvedValue(userByEmail as unknown as UserDocument);

      const result = await controller.findOne(email);

      expect(result).toEqual(userByEmail);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(email);
    });

    it('should find a user by username', async () => {
      const userByUsername = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        fullname: 'Test User',
        password: 'hashedpass',
        birthDate: new Date(),
        refreshToken: null,
        stripeCustomerId: null,
        resetCode: null,
        __v: 0,
      } as any;

      mockUsersService.findOne.mockResolvedValue(userByUsername as unknown as UserDocument);

      const result = await controller.findOne(username);

      expect(result).toEqual(userByUsername);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(username);
    });

    // JwtAuthGuard Tests
    it('should deny requests without a valid token', async () => {
      const mockGuard = new JwtAuthGuard(mockJwtService, mockReflector);
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      const result = await mockGuard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should allow requests with a valid token', async () => {
      const mockGuard = new JwtAuthGuard(mockJwtService, mockReflector);
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer valid-token',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user123' });

      const result = await mockGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  describe('update', () => {
    const userId = new Types.ObjectId().toString();
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
      password: 'oldpassword',
      updatedPassword: 'newpassword',
    };

    it('should update a user', async () => {
      const mockCollection = {
        dbName: 'test',
        hint: jest.fn(),
        timeoutMS: 30000,
        createIndexes: jest.fn(),
        $format: jest.fn(),
        $print: jest.fn(),
        getIndexes: jest.fn(),
        ensureIndex: jest.fn(),
        dropIndex: jest.fn(),
        dropIndexes: jest.fn(),
        createIndex: jest.fn(),
        listIndexes: jest.fn(),
        indexExists: jest.fn(),
        indexInformation: jest.fn(),
        initializeOrderedBulkOp: jest.fn(),
        initializeUnorderedBulkOp: jest.fn(),
        insert: jest.fn(),
        insertOne: jest.fn(),
        insertMany: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        updateOne: jest.fn(),
        updateMany: jest.fn(),
        remove: jest.fn(),
        deleteOne: jest.fn(),
        deleteMany: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
        findOneAndReplace: jest.fn(),
        aggregate: jest.fn(),
        bulkWrite: jest.fn(),
        count: jest.fn(),
        countDocuments: jest.fn(),
        estimatedDocumentCount: jest.fn(),
        distinct: jest.fn(),
        drop: jest.fn(),
        isCapped: jest.fn(),
        options: jest.fn(),
        rename: jest.fn(),
        stats: jest.fn(),
        watch: jest.fn(),
        mapReduce: jest.fn(),
        geoHaystackSearch: jest.fn(),
        indexes: jest.fn(),
        parallelCollectionScan: jest.fn(),
        replaceOne: jest.fn(),
        findAndModify: jest.fn(),
        listSearchIndexes: jest.fn(),
        createSearchIndex: jest.fn(),
        createSearchIndexes: jest.fn(),
        dropSearchIndex: jest.fn(),
        updateSearchIndex: jest.fn(),
        collectionName: 'users',
        conn: {
          aggregate: jest.fn(),
          asPromise: jest.fn(),
          close: jest.fn(),
          destroy: jest.fn(),
          collection: jest.fn(),
          createCollection: jest.fn(),
          dropCollection: jest.fn(),
          dropDatabase: jest.fn(),
          listCollections: jest.fn(),
          model: jest.fn(),
          modelNames: jest.fn(),
          plugin: jest.fn(),
          startSession: jest.fn(),
          transaction: jest.fn(),
          useDb: jest.fn(),
          watch: jest.fn(),
          host: 'localhost',
          port: 27017,
          name: 'test',
          options: {},
          config: {},
          db: {
            databaseName: 'test',
            options: {},
            secondaryOk: false,
            readConcern: {
              level: 'local',
              toJSON: jest.fn(),
              severity: 1
            },
            writeConcern: {
              w: 1,
              j: true,
              wtimeout: 0,
              toJSON: jest.fn()
            },
            readPreference: {
              mode: 'primary' as const,
              tags: [],
              hedge: {},
              maxStalenessSeconds: 0,
              minWireVersion: 0,
              toJSON: jest.fn(),
              preference: 'primary' as const,
              isValid: jest.fn(() => true),
              secondaryOk: false,
              equals: jest.fn(),
              severity: 1
            },
            namespace: {},
            bufferMaxEntries: 0,
            command: jest.fn(),
            createCollection: jest.fn(),
            createIndex: jest.fn(),
            dropCollection: jest.fn(),
            dropDatabase: jest.fn(),
            executeDbAdminCommand: jest.fn(),
            indexInformation: jest.fn(),
            listCollections: jest.fn(),
            profilingLevel: jest.fn(),
            removeUser: jest.fn(),
            renameCollection: jest.fn(),
            setProfilingLevel: jest.fn(),
            stats: jest.fn(),
            admin: jest.fn(),
            collection: jest.fn(),
            collections: jest.fn(),
            eval: jest.fn(),
            addUser: jest.fn()
          },
          id: 1,
          models: {},
          collections: {},
          replica: false,
          states: {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
            99: 'uninitialized'
          },
          on: jest.fn(),
          once: jest.fn(),
          emit: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          removeAllListeners: jest.fn(),
          setMaxListeners: jest.fn(),
          getMaxListeners: jest.fn(),
          listeners: jest.fn(),
          rawListeners: jest.fn(),
          listenerCount: jest.fn(),
          prependListener: jest.fn(),
          prependOnceListener: jest.fn(),
          eventNames: jest.fn()
        },
        name: 'users',
        namespace: 'test.users',
        writeConcern: { w: 1 },
        readConcern: { level: 'local' },
        readPreference: { mode: 'primary' },
        bsonOptions: {},
        pkFactory: { createPk: jest.fn() },
        promiseLibrary: Promise,
        serializeFunctions: false,
        strict: true,
        capped: false,
        size: 0,
        max: 0,
        autoIndexId: true,
        raw: false,
        bufferMaxEntries: 0,
        baseModelName: 'User',
        modelName: 'User',
        schema: {},
        db: {
          databaseName: 'test',
          options: {},
          secondaryOk: false,
          readConcern: {
            level: 'local',
            toJSON: jest.fn(),
            severity: 1
          },
          writeConcern: {
            w: 1,
            j: true,
            wtimeout: 0,
            toJSON: jest.fn()
          },
          readPreference: {
            mode: 'primary' as const,
            tags: [],
            hedge: {},
            maxStalenessSeconds: 0,
            minWireVersion: 0,
            toJSON: jest.fn(),
            preference: 'primary' as const,
            isValid: jest.fn(() => true),
            secondaryOk: false,
            equals: jest.fn(),
            severity: 1
          },
          namespace: {},
          bufferMaxEntries: 0,
          command: jest.fn(),
          createCollection: jest.fn(),
          createIndex: jest.fn(),
          dropCollection: jest.fn(),
          dropDatabase: jest.fn(),
          executeDbAdminCommand: jest.fn(),
          indexInformation: jest.fn(),
          listCollections: jest.fn(),
          profilingLevel: jest.fn(),
          removeUser: jest.fn(),
          renameCollection: jest.fn(),
          setProfilingLevel: jest.fn(),
          stats: jest.fn(),
          admin: jest.fn(),
          collection: jest.fn(),
          collections: jest.fn(),
          eval: jest.fn(),
          addUser: jest.fn()
        }
      } as any;

      const expectedUser = { 
        _id: userId, 
        email: 'updated@example.com',
        username: 'testuser',
        fullname: 'Test User',
        password: 'hashedpass',
        birthDate: new Date(),
        refreshToken: null,
        stripeCustomerId: null,
        resetCode: null,
        __v: 0,
        $assertPopulated: jest.fn(),
        $clearModifiedPaths: jest.fn(),
        $clone: jest.fn(),
        $getAllSubdocs: jest.fn(),
        $ignore: jest.fn(),
        $isDefault: jest.fn(),
        $isDeleted: jest.fn(),
        $isEmpty: jest.fn(),
        $isValid: jest.fn(),
        $locals: {},
        $markValid: jest.fn(),
        $model: jest.fn(),
        $op: null,
        $session: jest.fn(),
        $set: jest.fn(),
        collection: mockCollection,
        db: {},
        delete: jest.fn(),
        deleteOne: jest.fn(),
        depopulate: jest.fn(),
        directModifiedPaths: jest.fn(),
        equals: jest.fn(),
        errors: {},
        get: jest.fn(),
        getChanges: jest.fn(),
        increment: jest.fn(),
        init: jest.fn(),
        invalidate: jest.fn(),
        isDirectModified: jest.fn(),
        isDirectSelected: jest.fn(),
        isInit: jest.fn(),
        isModified: jest.fn(),
        isNew: false,
        isSelected: jest.fn(),
        markModified: jest.fn(),
        modifiedPaths: jest.fn(),
        overwrite: jest.fn(),
        populate: jest.fn(),
        populated: jest.fn(),
        remove: jest.fn(),
        replaceOne: jest.fn(),
        save: jest.fn(),
        schema: {},
        set: jest.fn(),
        toJSON: jest.fn(),
        toObject: jest.fn(),
        unmarkModified: jest.fn(),
        update: jest.fn(),
        updateOne: jest.fn(),
        validate: jest.fn(),
        validateSync: jest.fn(),
        $createModifiedPathsSnapshot: jest.fn(),
        $getPopulatedDocs: jest.fn(),
        $inc: jest.fn(),
        $restoreModifiedPathsSnapshot: jest.fn(),
        $parent: jest.fn(),
        $__: jest.fn(),
        $where: {},
        model: jest.fn(),
      };

      mockUsersService.update.mockResolvedValue(expectedUser as unknown as UserDocument);

      const result5 = await controller.update(userId, updateUserDto);

      expect(result5).toEqual(expectedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockUsersService.update.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when update fails', async () => {
      mockUsersService.update.mockRejectedValue(new BadRequestException('Invalid password'));

      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(BadRequestException);
    });

    // ParseMongoIdPipe Tests
    it('should throw BadRequestException when invalid ID is provided', async () => {
      const parseMongoIdPipe = new ParseMongoIdPipe();
      const invalidId = 'invalid-id';

      // We expect the pipe to throw a BadRequestException, so we need to catch it
      try {
        await parseMongoIdPipe.transform(invalidId, { type: 'param', metatype: String });
        // If we get here, the test should fail
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('invalid-id is not a valid MongoID');
      }
    });

    // Edge Cases for Updates
    it('should handle partial updates with only email', async () => {
      const partialUpdateDto = {
        email: 'newemail@example.com',
      };

      const updatedUser = {
        _id: userId,
        email: 'newemail@example.com',
        username: 'testuser',
        fullname: 'Test User',
        password: 'hashedpass',
        birthDate: new Date(),
        refreshToken: null,
        stripeCustomerId: null,
        resetCode: null,
        __v: 0,
      } as any;

      mockUsersService.update.mockResolvedValue(updatedUser as unknown as UserDocument);

      const result = await controller.update(userId, partialUpdateDto as UpdateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(userId, partialUpdateDto);
    });

    it('should handle partial updates with only password', async () => {
      const partialUpdateDto = {
        password: 'oldpassword',
        updatedPassword: 'newpassword',
      };

      const updatedUser = {
        _id: userId,
        email: 'test@example.com',
        username: 'testuser',
        fullname: 'Test User',
        password: 'newhashedpass',
        birthDate: new Date(),
        refreshToken: null,
        stripeCustomerId: null,
        resetCode: null,
        __v: 0,
      } as any;

      mockUsersService.update.mockResolvedValue(updatedUser as unknown as UserDocument);

      const result = await controller.update(userId, partialUpdateDto);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(userId, partialUpdateDto);
    });
  });

  describe('remove', () => {
    const userId = new Types.ObjectId();

    it('should remove a user', async () => {
      const mockCollection = {
        dbName: 'test',
        hint: jest.fn(),
        timeoutMS: 30000,
        createIndexes: jest.fn(),
        $format: jest.fn(),
        $print: jest.fn(),
        getIndexes: jest.fn(),
        ensureIndex: jest.fn(),
        dropIndex: jest.fn(),
        dropIndexes: jest.fn(),
        createIndex: jest.fn(),
        listIndexes: jest.fn(),
        indexExists: jest.fn(),
        indexInformation: jest.fn(),
        initializeOrderedBulkOp: jest.fn(),
        initializeUnorderedBulkOp: jest.fn(),
        insert: jest.fn(),
        insertOne: jest.fn(),
        insertMany: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        updateOne: jest.fn(),
        updateMany: jest.fn(),
        remove: jest.fn(),
        deleteOne: jest.fn(),
        deleteMany: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
        findOneAndReplace: jest.fn(),
        aggregate: jest.fn(),
        bulkWrite: jest.fn(),
        count: jest.fn(),
        countDocuments: jest.fn(),
        estimatedDocumentCount: jest.fn(),
        distinct: jest.fn(),
        drop: jest.fn(),
        isCapped: jest.fn(),
        options: jest.fn(),
        rename: jest.fn(),
        stats: jest.fn(),
        watch: jest.fn(),
        mapReduce: jest.fn(),
        geoHaystackSearch: jest.fn(),
        indexes: jest.fn(),
        parallelCollectionScan: jest.fn(),
        replaceOne: jest.fn(),
        findAndModify: jest.fn(),
        listSearchIndexes: jest.fn(),
        createSearchIndex: jest.fn(),
        createSearchIndexes: jest.fn(),
        dropSearchIndex: jest.fn(),
        updateSearchIndex: jest.fn(),
        collectionName: 'users',
        conn: {
          aggregate: jest.fn(),
          asPromise: jest.fn(),
          close: jest.fn(),
          destroy: jest.fn(),
          collection: jest.fn(),
          createCollection: jest.fn(),
          dropCollection: jest.fn(),
          dropDatabase: jest.fn(),
          listCollections: jest.fn(),
          model: jest.fn(),
          modelNames: jest.fn(),
          plugin: jest.fn(),
          startSession: jest.fn(),
          transaction: jest.fn(),
          useDb: jest.fn(),
          watch: jest.fn(),
          host: 'localhost',
          port: 27017,
          name: 'test',
          options: {},
          config: {},
          db: {
            databaseName: 'test',
            options: {},
            secondaryOk: false,
            readConcern: {
              level: 'local',
              toJSON: jest.fn(),
              severity: 1
            },
            writeConcern: {
              w: 1,
              j: true,
              wtimeout: 0,
              toJSON: jest.fn()
            },
            readPreference: {
              mode: 'primary' as const,
              tags: [],
              hedge: {},
              maxStalenessSeconds: 0,
              minWireVersion: 0,
              toJSON: jest.fn(),
              preference: 'primary' as const,
              isValid: jest.fn(() => true),
              secondaryOk: false,
              equals: jest.fn(),
              severity: 1
            },
            namespace: {},
            bufferMaxEntries: 0,
            command: jest.fn(),
            createCollection: jest.fn(),
            createIndex: jest.fn(),
            dropCollection: jest.fn(),
            dropDatabase: jest.fn(),
            executeDbAdminCommand: jest.fn(),
            indexInformation: jest.fn(),
            listCollections: jest.fn(),
            profilingLevel: jest.fn(),
            removeUser: jest.fn(),
            renameCollection: jest.fn(),
            setProfilingLevel: jest.fn(),
            stats: jest.fn(),
            admin: jest.fn(),
            collection: jest.fn(),
            collections: jest.fn(),
            eval: jest.fn(),
            addUser: jest.fn()
          },
          id: 1,
          models: {},
          collections: {},
          replica: false,
          states: { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting', 99: 'uninitialized' },
          on: jest.fn(),
          once: jest.fn(),
          emit: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          removeAllListeners: jest.fn(),
          setMaxListeners: jest.fn(),
          getMaxListeners: jest.fn(),
          listeners: jest.fn(),
          rawListeners: jest.fn(),
          listenerCount: jest.fn(),
          prependListener: jest.fn(),
          prependOnceListener: jest.fn(),
          eventNames: jest.fn(),
          createCollections: jest.fn(),
          deleteModel: jest.fn(),
          get: jest.fn(),
          getClient: jest.fn(),
          readyState: 1,
          syncIndexes: jest.fn(),
          listDatabases: jest.fn(),
          openUri: jest.fn(),
          pass: '',
          plugins: [],
          setClient: jest.fn(),
          user: '',
          client: null,
          setMaxIdleTimeMS: jest.fn(),
          withSession: jest.fn(),
          off: jest.fn(),
          base: {},
          connections: [],
          createConnection: jest.fn(),
          disconnect: jest.fn(),
          set: jest.fn()
        },
        name: 'users',
        namespace: 'test.users',
        writeConcern: { w: 1 },
        readConcern: { level: 'local' },
        readPreference: { mode: 'primary' },
        bsonOptions: {},
        pkFactory: { createPk: jest.fn() },
        promiseLibrary: Promise,
        serializeFunctions: false,
        strict: true,
        capped: false,
        size: 0,
        max: 0,
        autoIndexId: true,
        raw: false,
        bufferMaxEntries: 0,
        baseModelName: 'User',
        modelName: 'User',
        schema: {}
      } as any;

      const expectedUser = { 
        _id: userId.toString(), 
        email: 'test@example.com',
        username: 'testuser',
        fullname: 'Test User',
        password: 'hashedpass',
        birthDate: new Date(),
        refreshToken: null,
        stripeCustomerId: null,
        resetCode: null,
        __v: 0,
        $assertPopulated: jest.fn(),
        $clearModifiedPaths: jest.fn(),
        $clone: jest.fn(),
        $getAllSubdocs: jest.fn(),
        $ignore: jest.fn(),
        $isDefault: jest.fn(),
        $isDeleted: jest.fn(),
        $isEmpty: jest.fn(),
        $isValid: jest.fn(),
        $locals: {},
        $markValid: jest.fn(),
        $model: jest.fn(),
        $op: null,
        $session: jest.fn(),
        $set: jest.fn(),
        collection: mockCollection,
        db: {},
        delete: jest.fn(),
        deleteOne: jest.fn(),
        depopulate: jest.fn(),
        directModifiedPaths: jest.fn(),
        equals: jest.fn(),
        errors: {},
        get: jest.fn(),
        getChanges: jest.fn(),
        increment: jest.fn(),
        init: jest.fn(),
        invalidate: jest.fn(),
        isDirectModified: jest.fn(),
        isDirectSelected: jest.fn(),
        isInit: jest.fn(),
        isModified: jest.fn(),
        isNew: false,
        isSelected: jest.fn(),
        markModified: jest.fn(),
        modifiedPaths: jest.fn(),
        overwrite: jest.fn(),
        populate: jest.fn(),
        populated: jest.fn(),
        remove: jest.fn(),
        replaceOne: jest.fn(),
        save: jest.fn(),
        schema: {},
        set: jest.fn(),
        toJSON: jest.fn(),
        toObject: jest.fn(),
        unmarkModified: jest.fn(),
        update: jest.fn(),
        updateOne: jest.fn(),
        validate: jest.fn(),
        validateSync: jest.fn(),
        $createModifiedPathsSnapshot: jest.fn(),
        $getPopulatedDocs: jest.fn(),
        $inc: jest.fn(),
        $restoreModifiedPathsSnapshot: jest.fn(),
        $parent: jest.fn(),
        $__: jest.fn(),
        $where: {},
        model: jest.fn(),
      };

      mockUsersService.remove.mockResolvedValue(expectedUser as unknown as (Document<unknown, {}, UserDocument> & UserDocument & Document<unknown, any, any> & Required<{ _id: unknown; }> & { __v: number; }));

      const result6 = await controller.remove(userId);

      expect(result6).toEqual(expectedUser);
      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException when user is not found', async () => {
      mockUsersService.remove.mockRejectedValue(new BadRequestException('User not found'));

      await expect(controller.remove(userId)).rejects.toThrow(BadRequestException);
    });

    // Edge Cases for Deletion
    it('should throw NotFoundException when deleting a non-existent user', async () => {
      mockUsersService.remove.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.remove(userId)).rejects.toThrow(NotFoundException);
    });
  });
}); 