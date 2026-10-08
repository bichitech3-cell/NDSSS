import pool from '../db';

export const logAction = async (
  user_id: string,
  action: string,
  record_table: string,
  record_id: string,
  reason: string,
  previous_value?: any,
  new_value?: any
) => {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, record_table, record_id, reason, previous_value, new_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [user_id, action, record_table, record_id, reason, previous_value, new_value]
  );
};
