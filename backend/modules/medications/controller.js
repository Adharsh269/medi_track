import { body, text, nullable, uuid, id, choice, timezone, timestamp, boolean, date, integer, times, percentage } from '../../lib/validation.js';
import { createRow, listRows, getRow, updateRow } from '../../lib/queries.js';

const fields = {
  patient_id: uuid,
  name: text(200),
  dosage: text(200),
  frequency: text(200),
  times: times,
  start_date: date,
  end_date: nullable(date),
  pills_remaining: nullable(integer),
  refill_threshold: integer,
  active: boolean,
};

export function makeController(pool) {
  return {
    async create(req, res) {
      const data = body(req.body, fields, ["patient_id", "name", "dosage", "frequency", "times", "start_date"]);
      const row = await createRow(pool, 'medications', data);
      res.status(201).json({ data: row });
    },

    async list(req, res) {
      const filters = { patient_id: fields.patient_id };
      const rows = await listRows(pool, 'medications', req.query, filters);
      res.json({ data: rows });
    },

    async get(req, res) {
      const row = await getRow(pool, 'medications', id(req.params.id));
      res.json({ data: row });
    },

    async update(req, res) {
      const editable = { name: fields.name, dosage: fields.dosage, frequency: fields.frequency, times: fields.times, start_date: fields.start_date, end_date: fields.end_date, pills_remaining: fields.pills_remaining, refill_threshold: fields.refill_threshold, active: fields.active };
      const data = body(req.body, editable);
      const row = await updateRow(pool, 'medications', id(req.params.id), data, true);
      res.json({ data: row });
    }
  };
}
