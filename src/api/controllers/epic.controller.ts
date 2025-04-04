import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Inject, ParseIntPipe } from '@nestjs/common';
import { EpicService } from '../services/epic.service';
import { EpicCreateRequest, EpicResponse, EpicListResponse, EpicUpdateRequest, EpicIssuesResponse } from '../types/epic.d';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiTags } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationError } from 'class-validator';
import { CreateEpicDto, UpdateEpicDto } from '../types/epic.d';

@ApiTags('epics')
@Controller('epics')
export class EpicController {
  constructor(private readonly epicService: EpicService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new epic' })
  @ApiBody({ type: CreateEpicDto })
  @ApiResponse({ status: 201, description: 'Epic created successfully', type: EpicResponse })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @HttpCode(HttpStatus.CREATED)
  async createEpic(@Body() createEpicDto: CreateEpicRequest): Promise<EpicResponse> {
    try {
      const epicDto = plainToClass(CreateEpicDto, createEpicDto);
      const errors: ValidationError[] = await validate(epicDto);

      if (errors.length > 0) {
        const errorMessages = errors.map((err) => Object.values(err.constraints)).flat();
        throw { status: HttpStatus.BAD_REQUEST, message: `Validation failed: ${errorMessages.join(', ')}` };
      }
      return await this.epicService.createEpic(createEpicDto);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw { status, message: error.message || 'Internal server error' };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all epics' })
  @ApiResponse({ status: 200, description: 'List of epics', type: [EpicResponse] })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async listEpics(): Promise<EpicListResponse> {
    try {
      return await this.epicService.listEpics();
    } catch (error: any) {
      throw { status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message || 'Internal server error' };
    }
  }

  @Get(':epicKey')
  @ApiOperation({ summary: 'Get a specific epic by key' })
  @ApiParam({ name: 'epicKey', description: 'The key of the epic' })
  @ApiResponse({ status: 200, description: 'Epic found', type: EpicResponse })
  @ApiResponse({ status: 404, description: 'Epic not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getEpic(@Param('epicKey') epicKey: string): Promise<EpicResponse> {
    try {
      const epic = await this.epicService.getEpic(epicKey);
      if (!epic) {
        throw { status: HttpStatus.NOT_FOUND, message: 'Epic not found' };
      } 
      return epic;
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw { status, message: error.message || 'Internal server error' };
    }
  }

  @Put(':epicKey')
  @ApiOperation({ summary: 'Update an epic' })
  @ApiParam({ name: 'epicKey', description: 'The key of the epic' })
  @ApiBody({ type: UpdateEpicDto })
  @ApiResponse({ status: 200, description: 'Epic updated successfully', type: EpicResponse })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({ status: 404, description: 'Epic not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async updateEpic(
    @Param('epicKey') epicKey: string,
    @Body() updateEpicDto: UpdateEpicRequest,
  ): Promise<EpicResponse> {
    try {

      const epicDto = plainToClass(UpdateEpicDto, updateEpicDto);
      const errors: ValidationError[] = await validate(epicDto);

      if (errors.length > 0) {
        const errorMessages = errors.map((err) => Object.values(err.constraints)).flat();
        throw { status: HttpStatus.BAD_REQUEST, message: `Validation failed: ${errorMessages.join(', ')}` };
      }

      const updatedEpic = await this.epicService.updateEpic(epicKey, updateEpicDto);

      if (!updatedEpic) {
        throw { status: HttpStatus.NOT_FOUND, message: 'Epic not found' };
      }
      return updatedEpic;
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw { status, message: error.message || 'Internal server error' };
    }
  }

  @Delete(':epicKey')
  @ApiOperation({ summary: 'Delete an epic' })
  @ApiParam({ name: 'epicKey', description: 'The key of the epic' })
  @ApiResponse({ status: 204, description: 'Epic deleted successfully' })
  @ApiResponse({ status: 404, description: 'Epic not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEpic(@Param('epicKey') epicKey: string): Promise<void> {
    try {
      await this.epicService.deleteEpic(epicKey);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw { status, message: error.message || 'Internal server error' };
    }
  }

  @Get(':epicKey/issues')
  @ApiOperation({ summary: 'Get issues associated with an epic' })
  @ApiParam({ name: 'epicKey', description: 'The key of the epic' })
  @ApiResponse({ status: 200, description: 'List of issues', type: [EpicIssue] })
  @ApiResponse({ status: 404, description: 'Epic not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getIssuesForEpic(@Param('epicKey') epicKey: string): Promise<EpicIssuesResponse> {
    try {
      return await this.epicService.getIssuesForEpic(epicKey);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      throw { status, message: error.message || 'Internal server error' };
    }
  }
}


// DTOs for validation
class EpicCreateDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

class EpicUpdateDto {
  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
