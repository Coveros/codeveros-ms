import * as mongoose from 'mongoose';

export function getModel(modelName: string): mongoose.Model<any> {
  return mongoose.models[modelName];
}
