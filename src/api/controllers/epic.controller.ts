// src/api/controllers/epic.controller.ts
import { Request, Response } from 'express';
import { EpicService } from '../services/epic.service';
import { Epic } from '../types/epic.d';
import { validationResult } from 'express-validator';

/**
 * Controller for handling Epic-related requests.
 */
export class EpicController {
  private readonly epicService: EpicService;

  /**
   * Constructs an EpicController.
   * @param epicService The service for Epic-related operations.
   */
  constructor(epicService: EpicService) {
    this.epicService = epicService;
  }

  /**
   * Handles the request to get an Epic by its key.
   * @param req The Express request object.
   * @param res The Express response object.
   * @returns A JSON response with the Epic data or an error message.
   */
  async getEpic(req: Request, res: Response) {
    const { epicKey } = req.params;

    try {
      const epic = await this.epicService.getEpic(epicKey);
      if (!epic) {
        return res.status(404).json({ message: 'Epic not found' });
      }
      res.json(epic);
    } catch (error: any) {
      console.error('Error fetching epic:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  /**
   * Handles the request to list all Epics.
   * @param req The Express request object.
   * @param res The Express response object.
   * @returns A JSON response with an array of Epic data.
   */
  async listEpics(req: Request, res: Response) {
    try {
      const epics = await this.epicService.listEpics();
      res.json(epics);
    } catch (error: any) {
      console.error('Error listing epics:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  /**
   * Handles the request to create a new Epic.
   * @param req The Express request object.
   * @param res The Express response object.
   * @returns A JSON response with the new Epic data or an error message.
   */
  async createEpic(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newEpic: Epic = await this.epicService.createEpic(req.body);
      res.status(201).json(newEpic);
    } catch (error: any) {
      console.error('Error creating epic:', error);
      res.status(400).json({ message: error.message || 'Invalid input' });
    }
  }

  /**
   * Handles the request to update an existing Epic.
   * @param req The Express request object.
   * @param res The Express response object.
   * @returns A JSON response with the updated Epic data or an error message.
   */
  async updateEpic(req: Request, res: Response) {
    const { epicKey } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updatedEpic = await this.epicService.updateEpic(epicKey, req.body);
      if (!updatedEpic) {
        return res.status(404).json({ message: 'Epic not found' });
      }
      res.json(updatedEpic);
    } catch (error: any) {
      console.error('Error updating epic:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }

  /**
   * Handles the request to delete an Epic.
   * @param req The Express request object.
   * @param res The Express response object.
   */
  async deleteEpic(req: Request, res: Response) {
    const { epicKey } = req.params;

    try {
      await this.epicService.deleteEpic(epicKey);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting epic:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}
