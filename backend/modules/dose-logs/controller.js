import { body, text, nullable, uuid, id, choice, timezone, timestamp, boolean, date, integer, times, percentage } from '../../lib/validation.js';
import { createRow, listRows, getRow, updateRow } from '../../lib/queries.js';

const fields = {
  medication_id: id,
  scheduled_time: timestamp,
  status: choice(['pending','taken','skipped','missed','snoozed']),
  actual_time_taken: nullable(timestamp),
  snoozed_until: nullable(timestamp),
  response_source: nullable(choice(['web','whatsapp'])),
  responded_at: nullable(timestamp),
  notes: nullable(text(2000)),
};

export function makeController(pool) {
  return {
    async create(req, res) {
      const data = body(req.body, fields, ["medication_id", "scheduled_time"]);
      const row = await createRow(pool, 'dose_logs', data);
      res.status(201).json({ data: row });
    },

    async list(req, res) {
      const filters = { medication_id: fields.medication_id, status: fields.status };
      const rows = await listRows(pool, 'dose_logs', req.query, filters);
      res.json({ data: rows });
    },

    async get(req, res) {
      const row = await getRow(pool, 'dose_logs', id(req.params.id));
      res.json({ data: row });
    },

    async update(req, res) {
      const editable = { scheduled_time: fields.scheduled_time, status: fields.status, actual_time_taken: fields.actual_time_taken, snoozed_until: fields.snoozed_until, response_source: fields.response_source, responded_at: fields.responded_at, notes: fields.notes };
      const data = body(req.body, editable);
      const row = await updateRow(pool, 'dose_logs', id(req.params.id), data, false);
      res.json({ data: row });
    }
  };
}
