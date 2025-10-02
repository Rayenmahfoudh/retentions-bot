import { AppError } from '@errors/AppError';
import * as fs from 'fs/promises';

export async function parseFile(filePath: string): Promise<string | Error> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return data;
  } catch (error) {
    throw new AppError(`Error reading file ${filePath}, error ${error}`)
  }
}
