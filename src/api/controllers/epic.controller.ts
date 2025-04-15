import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { EpicService } from '../services/epic.service';
import { CreateEpicDto } from '../api/dto/create-epic.dto';
import { UpdateEpicDto } from '../api/dto/update-epic.dto';
import { Epic } from '../models/epic.model';

@Controller('epics')
export class EpicController {
  constructor(private readonly epicService: EpicService) {}

  @Post()
  async create(@Body() createEpicDto: CreateEpicDto): Promise<Epic> {
    return this.epicService.create(createEpicDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Epic> {
    const epic = await this.epicService.findOne(id);
    if (!epic) {
      throw new NotFoundException(`Epic with ID ${id} not found`);
    }
    return epic;
  }

  @Get()
  async findAll(): Promise<Epic[]> {
    return this.epicService.findAll();
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateEpicDto: UpdateEpicDto): Promise<Epic> {
    const epic = await this.epicService.update(id, updateEpicDto);
    if (!epic) {
      throw new NotFoundException(`Epic with ID ${id} not found`);
    }
    return epic;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    const epic = await this.epicService.remove(id);
    if (!epic) {
      throw new NotFoundException(`Epic with ID ${id} not found`);
    }
    return;
  }
}
