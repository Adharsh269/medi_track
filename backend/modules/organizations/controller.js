import { body, text, nullable, uuid, id, choice, timezone, timestamp, boolean, date, integer, times, percentage } from '../../lib/validation.js';
import { createRow, listRows, getRow, updateRow } from '../../lib/queries.js';

const fields = {
  name: text(200),
};

export function makeController(pool) {
  return {
    async create(req, res) {
      const data = body(req.body, fields, ["name"]);
      const row = await createRow(pool, 'organizations', data);
      res.status(201).json({ data: row });
    },

    async list(req, res) {
      const filters = {  };
      const rows = await listRows(pool, 'organizations', req.query, filters);
      res.json({ data: rows });
    },

    async get(req, res) {
      const row = await getRow(pool, 'organizations', id(req.params.id));
      res.json({ data: row });
    },

    async update(req, res) {
      const editable = { name: fields.name };
      const data = body(req.body, editable);
      const row = await updateRow(pool, 'organizations', id(req.params.id), data, false);
      res.json({ data: row });
    }
  };
}
