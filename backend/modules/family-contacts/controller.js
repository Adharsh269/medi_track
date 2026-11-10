import { body, text, nullable, uuid, id, choice, timezone, timestamp, boolean, date, integer, times, percentage } from '../../lib/validation.js';
import { createRow, listRows, getRow, updateRow } from '../../lib/queries.js';

const fields = {
  patient_id: uuid,
  full_name: text(200),
  phone: text(40),
  relationship: nullable(text(100)),
  whatsapp_enabled: boolean,
  active: boolean,
};

export function makeController(pool) {
  return {
    async create(req, res) {
      const data = body(req.body, fields, ["patient_id", "full_name", "phone"]);
      const row = await createRow(pool, 'patient_family_contacts', data);
      res.status(201).json({ data: row });
    },

    async list(req, res) {
      const filters = { patient_id: fields.patient_id };
      const rows = await listRows(pool, 'patient_family_contacts', req.query, filters);
      res.json({ data: rows });
    },

    async get(req, res) {
      const row = await getRow(pool, 'patient_family_contacts', id(req.params.id));
      res.json({ data: row });
    },

    async update(req, res) {
      const editable = { full_name: fields.full_name, phone: fields.phone, relationship: fields.relationship, whatsapp_enabled: fields.whatsapp_enabled, active: fields.active };
      const data = body(req.body, editable);
      const row = await updateRow(pool, 'patient_family_contacts', id(req.params.id), data, false);
      res.json({ data: row });
    }
  };
}
