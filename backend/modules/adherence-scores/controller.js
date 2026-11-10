import { body, text, nullable, uuid, id, choice, timezone, timestamp, boolean, date, integer, times, percentage } from '../../lib/validation.js';
import { createRow, listRows, getRow, updateRow } from '../../lib/queries.js';

const fields = {
  patient_id: uuid,
  start_date: date,
  end_date: date,
  adherence_percentage: nullable(percentage),
  risk_flag: nullable(choice(['low','medium','high'])),
  model_version: nullable(text(100)),
};

export function makeController(pool) {
  return {
    async create(req, res) {
      const data = body(req.body, fields, ["patient_id", "start_date", "end_date"]);
      const row = await createRow(pool, 'adherence_scores', data);
      res.status(201).json({ data: row });
    },

    async list(req, res) {
      const filters = { patient_id: fields.patient_id };
      const rows = await listRows(pool, 'adherence_scores', req.query, filters);
      res.json({ data: rows });
    },

    async get(req, res) {
      const row = await getRow(pool, 'adherence_scores', id(req.params.id));
      res.json({ data: row });
    },

    async update(req, res) {
      const editable = { start_date: fields.start_date, end_date: fields.end_date, adherence_percentage: fields.adherence_percentage, risk_flag: fields.risk_flag, model_version: fields.model_version };
      const data = body(req.body, editable);
      const row = await updateRow(pool, 'adherence_scores', id(req.params.id), data, false);
      res.json({ data: row });
    }
  };
}
