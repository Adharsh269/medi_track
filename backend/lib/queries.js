import { fail } from './errors.js';
import { page } from './validation.js';
// Table names and column names come only from our controller definitions.
// Every value from the request is passed separately as a $1, $2, ... parameter.
export async function createRow(pool, table, data) {
  const columns = Object.keys(data);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const sql = `INSERT INTO public.${table} (${columns.join(', ')})
    VALUES (${placeholders.join(', ')}) RETURNING *`;
  const result = await pool.query(sql, Object.values(data));
  return result.rows[0];
}
export async function listRows(pool, table, query, allowedFilters) {
  const [limit, offset] = page(query);
  const conditions = [], values = [];
  for (const [key, value] of Object.entries(query)) {
    if (key === 'limit' || key === 'offset') continue;
    if (!Object.hasOwn(allowedFilters, key)) fail(400, `Unsupported filter: ${key}`);
    const parsed = allowedFilters[key](value);
    values.push(parsed);
    conditions.push(`${key} = $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  values.push(limit, offset);
  const result = await pool.query(`SELECT * FROM public.${table} ${where}
    ORDER BY id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return result.rows;
}
export async function getRow(pool, table, id) {
  const result = await pool.query(`SELECT * FROM public.${table} WHERE id=$1`, [id]);
  if (!result.rows[0]) fail(404, 'Record not found.');
  return result.rows[0];
}
export async function updateRow(pool, table, id, data, hasUpdatedAt = false) {
  const columns = Object.keys(data);
  if (!columns.length) fail(400, 'Supply at least one editable field.');
  const assignments = columns.map((column, index) => `${column}=$${index + 1}`);
  if (hasUpdatedAt) assignments.push('updated_at=NOW()');
  const result = await pool.query(`UPDATE public.${table} SET ${assignments.join(', ')}
    WHERE id=$${columns.length + 1} RETURNING *`, [...Object.values(data), id]);
  if (!result.rows[0]) fail(404, 'Record not found.');
  return result.rows[0];
}
