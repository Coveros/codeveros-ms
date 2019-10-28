import { Model } from 'mongoose';

export interface DbModels {
  [modelName: string]: Model<any>;
}
