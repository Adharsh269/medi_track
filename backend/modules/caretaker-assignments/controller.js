import { body, text, nullable, uuid, id, choice, timezone, timestamp, boolean, date, integer, times, percentage } from '../../lib/validation.js';
import { createRow, listRows, getRow, updateRow } from '../../lib/queries.js';

const fields = {
  organization_id: id,
  caretaker_id: uuid,
  patient_id: uuid,
  assigned_by: uuid,
  revoked_at: nullable(timestamp),
  status: choice(['active','revoked']),
};

export function makeController(pool) {
  return {
    async create(req, res) {
      const data = body(req.body, fields, ["organization_id", "caretaker_id", "patient_id", "assigned_by"]);
      const row = await createRow(pool, 'caretaker_assignments', data);
      res.status(201).json({ data: row });
    },

    async list(req, res) {
      const filters = { patient_id: fields.patient_id, caretaker_id: fields.caretaker_id, organization_id: fields.organization_id, status: fields.status };
      const rows = await listRows(pool, 'caretaker_assignments', req.query, filters);
      res.json({ data: rows });
    },

    async get(req, res) {
      const row = await getRow(pool, 'caretaker_assignments', id(req.params.id));
      res.json({ data: row });
    },

    async update(req, res) {
      const editable = { revoked_at: fields.revoked_at, status: fields.status };
      const data = body(req.body, editable);
      const row = await updateRow(pool, 'caretaker_assignments', id(req.params.id), data, false);
      res.json({ data: row });
    }
  };
}
