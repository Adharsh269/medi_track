import { Router } from 'express';
import { makeController } from './controller.js';

export default function routes(pool) {
  const router = Router();
  const controller = makeController(pool);
  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.patch('/:id', controller.update);
  return router;
}
