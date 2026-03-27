import pool from "../config/db.js";
import redis from "../config/redis.js";
import { hashPassword } from "../utils/hash.js";

export const getCurrentUser = async (userId) => {
  const { rows } = await pool.query(
    `
      SELECT
        id, email, first_name, last_name, username, phone, dob,
        gender, avatar_url, bio, provider, role, is_active,
        created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  );

  return rows[0];
};

export const getUserById = async (id) => {
  const { rows } = await pool.query(
    `
      SELECT
        id, email, first_name, last_name, username, phone, dob,
        gender, avatar_url, bio, provider, role, is_active,
        created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return rows[0];
};

export const getAllUsers = async ({ page, limit, search }) => {
  const offset = (page - 1) * limit;
  const searchValue = `%${search}%`;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM users
    WHERE
      first_name ILIKE $1 OR
      last_name ILIKE $1 OR
      email ILIKE $1 OR
      username ILIKE $1
  `;

  const usersQuery = `
    SELECT
      id, email, first_name, last_name, username, phone, dob,
      gender, avatar_url, bio, provider, role, is_active,
      created_at, updated_at
    FROM users
    WHERE
      first_name ILIKE $1 OR
      last_name ILIKE $1 OR
      email ILIKE $1 OR
      username ILIKE $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countResult = await pool.query(countQuery, [searchValue]);
  const usersResult = await pool.query(usersQuery, [
    searchValue,
    limit,
    offset,
  ]);

  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / limit);

  return {
    users: usersResult.rows,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const updateCurrentUser = async (userId, data) => {
  const updates = [];
  const values = [];
  let index = 1;

  if (data.first_name) {
    updates.push(`first_name = $${index++}`);
    values.push(data.first_name);
  }

  if (data.last_name) {
    updates.push(`last_name = $${index++}`);
    values.push(data.last_name);
  }

  if (data.username) {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1 AND id != $2 LIMIT 1",
      [data.username, userId],
    );

    if (existingUser.rows.length > 0) {
      const error = new Error("Username already in use");
      error.statusCode = 409;
      throw error;
    }

    updates.push(`username = $${index++}`);
    values.push(data.username);
  }

  if (data.phone) {
    updates.push(`phone = $${index++}`);
    values.push(data.phone);
  }

  if (data.dob) {
    updates.push(`dob = $${index++}`);
    values.push(data.dob);
  }

  if (data.gender) {
    updates.push(`gender = $${index++}`);
    values.push(data.gender);
  }

  if (data.avatar_url) {
    updates.push(`avatar_url = $${index++}`);
    values.push(data.avatar_url);
  }

  if (data.bio) {
    updates.push(`bio = $${index++}`);
    values.push(data.bio);
  }

  if (data.password) {
    const hashedPassword = await hashPassword(data.password);
    updates.push(`password = $${index++}`);
    values.push(hashedPassword);

    await redis.del(`refresh:${userId}`);
  }

  if (updates.length === 0) {
    const error = new Error("No valid fields provided for update");
    error.statusCode = 400;
    throw error;
  }

  updates.push(`updated_at = NOW()`);

  values.push(userId);

  const { rows } = await pool.query(
    `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${index}
      RETURNING
        id, email, first_name, last_name, username, phone, dob,
        gender, avatar_url, bio, provider, role, is_active,
        created_at, updated_at
    `,
    values,
  );

  return rows[0];
};

export const deleteCurrentUser = async (userId) => {
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  await redis.del(`refresh:${userId}`);
  return true;
};
