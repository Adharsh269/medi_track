import { body, text, nullable, uuid, id, choice, timezone, timestamp, boolean, date, integer, times, percentage } from '../../lib/validation.js';
import { createRow, listRows, getRow, updateRow } from '../../lib/queries.js';

const fields = {
  patient_id: uuid,
  dose_log_id: nullable(id),
  type: choice(['reminder','missed_alert','refill_alert']),
  channel: choice(['whatsapp','web','email']),
  message: text(4000),
  scheduled_time: timestamp,
  sent_at: nullable(timestamp),
  status: choice(['pending','sent','delivered','failed']),
  provider_message_id: nullable(text(500)),
};

export function makeController(pool) {
  return {
    async create(req, res) {
      const data = body(req.body, fields, ["patient_id", "type", "message", "scheduled_time"]);
      const row = await createRow(pool, 'notifications', data);
      res.status(201).json({ data: row });
    },

    async list(req, res) {
      const filters = { patient_id: fields.patient_id, status: fields.status, type: fields.type };
      const rows = await listRows(pool, 'notifications', req.query, filters);
      res.json({ data: rows });
    },

    async get(req, res) {
      const row = await getRow(pool, 'notifications', id(req.params.id));
      res.json({ data: row });
    },

    async update(req, res) {
      const editable = { dose_log_id: fields.dose_log_id, type: fields.type, channel: fields.channel, message: fields.message, scheduled_time: fields.scheduled_time, sent_at: fields.sent_at, status: fields.status, provider_message_id: fields.provider_message_id };
      const data = body(req.body, editable);
      const row = await updateRow(pool, 'notifications', id(req.params.id), data, false);
      res.json({ data: row });
    }
  };
}
