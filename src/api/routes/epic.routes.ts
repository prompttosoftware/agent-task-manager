import { Module, Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { RouterModule, Routes } from '@nestjs/core';
import { EpicController } from './epic.controller';
import { EpicService } from '../services/epic.service';
import { CreateEpicDto, UpdateEpicDto } from '../types/epic.d';

@Controller('epics')
export class EpicRoutes {
  constructor(private readonly epicService: EpicService) {}

  @Get(':epicKey')
  async getEpic(@Param('epicKey') epicKey: string) {
    return this.epicService.getEpic(epicKey);
  }

  @Get()
  async listEpics() {
    return this.epicService.listEpics();
  }

  @Post()
  async createEpic(@Body() createEpicDto: CreateEpicDto) {
    return this.epicService.createEpic(createEpicDto);
  }

  @Put(':epicKey')
  async updateEpic(@Param('epicKey') epicKey: string, @Body() updateEpicDto: UpdateEpicDto) {
    return this.epicService.updateEpic(epicKey, updateEpicDto);
  }

  @Delete(':epicKey')
  async deleteEpic(@Param('epicKey') epicKey: string) {
    return this.epicService.deleteEpic(epicKey);
  }

  @Get(':epicKey/issues')
  async getIssuesForEpic(@Param('epicKey') epicKey: string) {
    return this.epicService.getIssuesForEpic(epicKey);
  }
}

const routes: Routes = [
  {
    path: '/api',
    children: [
      {
        path: '/epics',
        module: EpicRoutes, // Use EpicRoutes as the module
      },
    ],
  },
];

@Module({
  imports: [RouterModule.register(routes)],
  controllers: [EpicRoutes], // Use EpicRoutes as the controller
  providers: [EpicService],
})
export class EpicModule {}
