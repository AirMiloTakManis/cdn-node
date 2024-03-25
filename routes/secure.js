const express = require('express');

const router = express.Router();
const c = require('../controllers');
const m = require('../middleware');

router.get('/role', c.role.index);

router.get('/users', c.user.index);
router.get('/user', c.user.getDetails);
router.post('/user/:UserId', c.user.updateUser);
router.post('/user', c.user.createUser);
router.delete('/user/:UserId', c.userUpdate.destroy);


module.exports = router;
