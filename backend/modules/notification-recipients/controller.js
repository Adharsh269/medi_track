import { body, text, nullable, uuid, id, choice, timezone, timestamp, boolean, date, integer, times, percentage } from '../../lib/validation.js';
import { createRow, listRows, getRow, updateRow } from '../../lib/queries.js';

const fields = {
  notification_id: id,
  user_id: nullable(uuid),
  family_contact_id: nullable(id),
  status: choice(['pending','sent','delivered','failed']),
  sent_at: nullable(timestamp),
  delivered_at: nullable(timestamp),
};

export function makeController(pool) {
  return {
    async create(req, res) {
      const data = body(req.body, fields, ["notification_id"]);
      const row = await createRow(pool, 'notification_recipients', data);
      res.status(201).json({ data: row });
    },

    async list(req, res) {
      const filters = { notification_id: fields.notification_id, user_id: fields.user_id, family_contact_id: fields.family_contact_id, status: fields.status };
      const rows = await listRows(pool, 'notification_recipients', req.query, filters);
      res.json({ data: rows });
    },

    async get(req, res) {
      const row = await getRow(pool, 'notification_recipients', id(req.params.id));
      res.json({ data: row });
    },

    async update(req, res) {
      const editable = { status: fields.status, sent_at: fields.sent_at, delivered_at: fields.delivered_at };
      const data = body(req.body, editable);
      const row = await updateRow(pool, 'notification_recipients', id(req.params.id), data, false);
      res.json({ data: row });
    }
  };
}
