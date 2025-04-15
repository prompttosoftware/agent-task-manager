import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { IssueService } from '../services/issue.service';
import { CreateIssueDto } from '../api/dto/create-issue.dto';
import { UpdateIssueDto } from '../api/dto/update-issue.dto';
import { Issue } from '../models/issue.model';

@Controller('issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Post()
  async create(@Body() createIssueDto: CreateIssueDto): Promise<Issue> {
    return this.issueService.create(createIssueDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Issue> {
    const issue = await this.issueService.findOne(id);
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }
    return issue;
  }

  @Get()
  async findAll(): Promise<Issue[]> {
    return this.issueService.findAll();
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateIssueDto: UpdateIssueDto): Promise<Issue> {
    const issue = await this.issueService.update(id, updateIssueDto);
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }
    return issue;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    const issue = await this.issueService.remove(id);
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }
    return;
  }
}
