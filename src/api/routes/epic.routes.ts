import { Module } from '@nestjs/common';
import { RouterModule, Routes } from '@nestjs/core';
import { EpicController } from './epic.controller';
import { EpicService } from '../services/epic.service';

const routes: Routes = [
  {
    path: '/api',
    children: [
      {
        path: '/epics',
        module: EpicModule,
      },
    ],
  },
];

@Module({
  imports: [RouterModule.register(routes)],
  controllers: [EpicController],
  providers: [EpicService],
})
export class EpicModule {}
