import { Test, TestingModule, INestApplication } from '@nestjs/testing';
import { EpicController } from './epic.controller';
import { EpicService } from '../services/epic.service';
import { Epic } from '../../types/epic.d';
import * as request from 'supertest';
describe('EpicController', () => {
 let controller: EpicController;
 let epicService: EpicService;
 let app: INestApplication;

 const mockEpic: Epic = {
 key: 'TEST-1',
 name: 'Test Epic',
 description: 'Test Description',
 status: 'Open',
 startDate: '2024-01-01',
 endDate: '2024-01-07',
 };

 const mockEpicArray: Epic[] = [mockEpic];

 const epicServiceMock = {
 getEpic: jest.fn().mockResolvedValue(mockEpic),
 listEpics: jest.fn().mockResolvedValue(mockEpicArray),
 createEpic: jest.fn().mockResolvedValue(mockEpic),
 updateEpic: jest.fn().mockResolvedValue(mockEpic),
 deleteEpic: jest.fn(),
 };

 beforeEach(async () => {
 const module: TestingModule = await Test.createTestingModule({
 controllers: [EpicController],
 providers: [
 {
 provide: EpicService,
 useValue: epicServiceMock,
 },
 ],
 }).compile();

 controller = module.get<EpicController>(EpicController);
 epicService = module.get<EpicService>(EpicService);

 app = module.createNestApplication();
 await app.init();
 });

 it('should be defined', () => {
 expect(controller).toBeDefined();
 expect(epicService).toBeDefined();
 });

 describe('GET /epics/:key', () => {
 it('should get an epic by key', async () => {
 const response = await request(app.getHttpServer())
 .get('/epics/TEST-1')
 .expect(200);

 expect(response.body).toEqual(mockEpic);
 expect(epicServiceMock.getEpic).toHaveBeenCalledWith('TEST-1');
 });
 });

 describe('GET /epics', () => {
 it('should get all epics', async () => {
 const response = await request(app.getHttpServer())
 .get('/epics')
 .expect(200);

 expect(response.body).toEqual(mockEpicArray);
 expect(epicServiceMock.listEpics).toHaveBeenCalled();
 });
 });

 describe('POST /epics', () => {
 it('should create an epic', async () => {
 const createEpicDto = {
 key: 'TEST-2',
 name: 'Test Epic',
 description: 'Test Description',
 status: 'Open',
 startDate: '2024-01-01',
 endDate: '2024-01-07',
 };
 const response = await request(app.getHttpServer())
 .post('/epics')
 .send(createEpicDto)
 .expect(201);

 expect(response.body).toEqual(mockEpic);
 expect(epicServiceMock.createEpic).toHaveBeenCalledWith(createEpicDto);
 });
 });

 describe('PUT /epics/:key', () => {
 it('should update an epic', async () => {
 const updateEpicDto = {
 name: 'Updated Name',
 };
 const response = await request(app.getHttpServer())
 .put('/epics/TEST-1')
 .send(updateEpicDto)
 .expect(200);

 expect(response.body).toEqual(mockEpic);
 expect(epicServiceMock.updateEpic).toHaveBeenCalledWith('TEST-1', updateEpicDto);
 });
 });

 describe('DELETE /epics/:key', () => {
 it('should delete an epic', async () => {
 await request(app.getHttpServer()).delete('/epics/TEST-1').expect(204);
 expect(epicServiceMock.deleteEpic).toHaveBeenCalledWith('TEST-1');
 });
 });

 afterEach(async () => {
 await app.close();
 });
