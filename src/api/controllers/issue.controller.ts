// src/api/controllers/issue.controller.ts
import { Controller, Post, Get, Param, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { IssueService } from '../services/issue.service';
import { Issue } from '../types/issue';

@Controller('api/issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createIssue(@Body() issue: Issue): Promise<Issue> {
    return this.issueService.addIssue(issue);
  }

  @Get(':id')
  async getIssue(@Param('id') id: string): Promise<Issue> {
    return this.issueService.getIssueById(id);
  }
}