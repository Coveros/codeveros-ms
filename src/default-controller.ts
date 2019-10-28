import { Context } from 'koa';
import * as defaultActions from './default-actions';

export async function create(ctx: Context) {
  ctx.body = await defaultActions.create(ctx);
}

export async function deleteOne(ctx: Context) {
  ctx.body = await defaultActions.deleteOne(ctx);
}

export async function find(ctx: Context) {
  ctx.body = await defaultActions.find(ctx);
}

export async function findOne(ctx: Context) {
  ctx.body = await defaultActions.findOne(ctx);
}

export async function update(ctx: Context) {
  ctx.body = await defaultActions.update(ctx);
}
