const moment = require('moment');
const jwt = require('jsonwebtoken');
const helper = require('../helper');
const Sequelize = require('sequelize');
const { encoderBase64, removeTrailingSymbolFromUrl } = require('../helper');
const m = require('../models');
const svc = require('../services');
const bcrypt = require('bcrypt');


async function index(req, res) {
  const { page, perpage, offset, order, search } = req.query;

  try {
    if (search) {
      const data = await m.User.findAndCountAll({
        where: { skillsets: { [Sequelize.Op.like]: `%${search}%` } },
        attributes: { exclude: ['password'] },
        limit: perpage,
        offset,
        ...order,
      });
      res.json({
        data: data.rows, page, perpage, total: data.count,
      });
    } else {
      const data = await m.User.findAndCountAll({
        attributes: { exclude: ['password'] },
        limit: perpage,
        offset,
        ...order,
      });
      res.json({
        data: data.rows, page, perpage, total: data.count,
      });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
}

async function updateUser(req, res) {
  const {
    new_password, old_password,
  } = req.body;

  const fields = {};
  const fileds_that_allowed_to_be_update_directly = ['name', 'phone', 'email', 'skillsets', 'hobby', 'skillsets'];
  fileds_that_allowed_to_be_update_directly.forEach(f => {
    if (req.body[f]) {
      fields[f] = req.body[f];
    }
  });

  if (new_password && old_password) {
    const user = await m.User.findOne({ where: { id: req.params.UserId } });
    if (!bcrypt.compare(old_password, user.password)) {
      res.status(422).send({ error: 'Wrong old password' });
      return;
    }
    fields.password = bcrypt.hashSync(new_password, bcrypt.genSaltSync());
  }

  try {
    await m.User.update(fields, { where: { id: req.params.UserId } });
    res.json({ status: 'updated' });
  } catch (error) {
    res.status(500).send({ error });
  }
}

function getDetails(req, res) {
  const id = (req.query.id) ? req.query.id : req.user.id;
  if (req.user.RoleId === 1 || req.user.id === parseInt(id, 10)) {
    m.User.findOne({
      attributes: { exclude: ['password', 'updatedAt', 'reset_token'] },
      where: { id },
      include: [{ model: m.Role, attributes: ['id', 'name'] }],
    })
      .then((data) => res.json({ data }))
      .catch((e) => res.status(500).send({ error: e }));
  } else {
    res.status(403).send({ error: 'access denied' });
  }
}

function passwordForgot(req, res) {
  m.User.findOne({ where: { email: req.body.email } })
    .then(async (user) => {
      if (!user) {
        res.status(404).send({ data: 'user not found' });
        return;
      }

      const today_crypt = encoderBase64(moment().unix() + 86400000);
      const content = {
        uid: encoderBase64(user.id),
        token: today_crypt,
      };

      const token = jwt.sign(content, process.env.PROJECT_JWT_SECRET);
      await user.update({ reset_token: token });
      const url = `${removeTrailingSymbolFromUrl(req.body.redirect_url)}?token=${token}`;

      svc.sendMailForgotPassword(url, user);
      res.send({ data: 'successfuly request for password reset' });
    })
    .catch((e) => res.status(500).send({ error: e }));
}

function verifyUser(req, res) {
  m.User.findOne({ where: { id: req.body.id } })
    .then((user) => {
      if (!user) {
        res.status(404).send({ data: 'user not found' });
        return;
      }
      user.update({ verifiedAt: moment().format('YYYY-MM-DD HH:mm:ss') });
      res.json({ status: 'approved' });
    })
    .catch((e) => res.status(500).send({ error: e }));
}

async function deleteUser(req, res) {
  await m.User.findOne({ where: { id: req.params.UserId } })
    .then((user) => {
      if (!user) {
        res.status(404).send({ data: 'user not found' });
        return;
      }
      user.update({ is_delete: 1 });
      res.json({ status: 'User Deleted' });
    })
}

async function createUser(req, res) {
  const {
    name, password, phone, email, skillsets, username, hobby
  } = req.body;
  const user = await m.User.findOne({ where: { email } });
  if (user) {
    res.status(500).send({ error: 'That email is already taken' });
    return;
  }
  let hashpass;
  if (!password) {
    hashpass = bcrypt.hashSync('password', bcrypt.genSaltSync());
  } else {
    hashpass = bcrypt.hashSync(password, bcrypt.genSaltSync());
  }

  const data = {
    name, email, password: hashpass, phone, skillsets, username, hobby
  };
  try{
    m.User.create(data)
    .then((data) => res.json({ data }))
  } catch (error) {
    res.status(500).send({ error });
  }
}

module.exports = {
  getDetails, passwordForgot, verifyUser, index, updateUser, deleteUser, createUser
};
