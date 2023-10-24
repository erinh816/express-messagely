"use strict";

const { NotFoundError } = require("../expressError");
const db = require("../db");
const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");


/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPwd = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (
          username,
          password,
          first_name,
          last_name,
          phone,
          join_at)
         VALUES
          ($1, $2, $3, $4, $5, current_timestamp)
         RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPwd, first_name, last_name, phone]);

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`, [username]
    );

    const user = result.rows[0];

    if (!user) return false;

    return await bcrypt.compare(password, user.password) === true;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
       WHERE username = $1
       RETURNING username`, [username]
    );

    let user = result.rows[0];

    if (!user) throw new NotFoundError(`Can't find this user: ${username}`);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users
        ORDER BY username
      `
    );

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT
        username,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at
       FROM users
       WHERE username = $1
      `, [username]
    );

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`Can't find this user: ${username}`);

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT
          m.id,
          m.to_username,
          m.body,
          m.sent_at,
          m.read_at,
          u.username,
          u.first_name,
          u.last_name,
          u.phone
        FROM messages AS m
        JOIN users AS u ON m.to_username = u.username
        WHERE from_username = $1
      `, [username]
    );

    return results.rows.map(msg => ({
      id: msg.id,
      to_user: {
        username: msg.to_username,
        first_name: msg.first_name,
        last_name: msg.last_name,
        phone: msg.phone
      },
      body: msg.body,
      sent_at: msg.sent_at,
      read_at: msg.read_at
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT
        m.id,
        m.from_username,
        m.body,
        m.sent_at,
        m.read_at,
        u.username,
        u.first_name,
        u.last_name,
        u.phone
        FROM messages AS m
        JOIN users AS u ON m.from_username = u.username
        WHERE to_username = $1
      `, [username]
    );

    return results.rows.map(msg => ({
      id: msg.id,
      from_user: {
        username: msg.from_username,
        first_name: msg.first_name,
        last_name: msg.last_name,
        phone: msg.phone
      },
      body: msg.body,
      sent_at: msg.sent_at,
      read_at: msg.read_at
    }));
  }
}


module.exports = User;
