import { body, text, nullable, uuid, id, choice, timezone, timestamp, boolean, date, integer, times, percentage } from '../../lib/validation.js';
import { createRow, listRows, getRow, updateRow } from '../../lib/queries.js';

const fields = {
  id: uuid,
  organization_id: nullable(id),
  full_name: text(200),
  role: choice(['patient','caretaker','org_admin']),
  phone: nullable(text(40)),
  timezone: timezone,
};

export function makeController(pool) {
  return {
    async create(req, res) {
      const data = body(req.body, fields, ["id", "full_name", "role"]);
      const row = await createRow(pool, 'profiles', data);
      res.status(201).json({ data: row });
    },

    async list(req, res) {
      const filters = { organization_id: fields.organization_id, role: fields.role };
      const rows = await listRows(pool, 'profiles', req.query, filters);
      res.json({ data: rows });
    },

    async get(req, res) {
      const row = await getRow(pool, 'profiles', uuid(req.params.id));
      res.json({ data: row });
    },

    async update(req, res) {
      const editable = { organization_id: fields.organization_id, full_name: fields.full_name, role: fields.role, phone: fields.phone, timezone: fields.timezone };
      const data = body(req.body, editable);
      const row = await updateRow(pool, 'profiles', uuid(req.params.id), data, true);
      res.json({ data: row });
    }
  };
}
