import * as mongoose from 'mongoose';

export function loadModel<T extends mongoose.Document>(name: string, schema: mongoose.Schema): mongoose.Model<T> {
  if (mongoose.models[name]) {
    return mongoose.models[name];
  }
  return mongoose.model<T>(name, schema);
}
