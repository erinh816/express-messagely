"use strict";

const express = require("express");
const Router = require("express").Router;
const router = new Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UnauthorizedError, BadRequestError, NotFoundError } = require("../expressError");
const db = require("../db");

const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");


/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res, next) {

  if (req.body === undefined) throw new BadRequestError();
  const { username, password } = req.body;
  const result = await db.query(
    `SELECT password
       FROM users
       WHERE username = $1`,
    [username]);

  const user = result.rows[0];
  console.log("checkcheck:", user.password, password);

  if (user) {

    if (await bcrypt.compare(password, user.password) === true) {
      const token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ token });
    }
  }
  throw new UnauthorizedError("Invalid user/password");
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  console.log('igot rereqst.body');

  const { username, password, first_name, last_name, phone } = req.body;

  const hashedPassword = await bcrypt.hash(
    password, BCRYPT_WORK_FACTOR);

  const result = await db.query(
    `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
         VALUES
           ($1, $2, $3, $4, $5, current_timestamp)
         RETURNING username`,
    [username, hashedPassword, first_name, last_name, phone]);

  const newUser = result.rows[0];

  if (newUser) {
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  }

  throw new NotFoundError("Registration failed");
});

module.exports = router;
