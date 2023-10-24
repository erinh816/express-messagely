"use strict";

const Router = require("express").Router;
const router = new Router();
const { UnauthorizedError, BadRequestError, NotFoundError } = require("../expressError");
const db = require("../db");
const User = require("../models/user");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name}, ...]}
 *
 **/
router.get("/", ensureLoggedIn, async function (req, res, next) {
  const results = await User.all();

  if (results) return res.json(results);
  throw new NotFoundError("No user results found.")
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get("/:username", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
  const result = await User.get(req.params.username);

  if (result) return res.json(result);
  throw new NotFoundError("Couldn't load user details.")
});

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/to", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
  const results = await User.messagesTo(req.params.username)

  if (results) return res.json(results);
  throw new NotFoundError("Couldn't load messages.")
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/from", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
  const results = await User.messagesFrom(req.params.username)

  //TODO: Modify line 63 for UI/UI-friendly output
  if (results.length < 1) return res.json({message: results})
  if (results) return res.json(results);
  throw new NotFoundError("Couldn't load messages.")
});


module.exports = router;