const express = require('express');
const router = express.Router();
const {body} = require('express-validator')
const userController = require('../controllers/users.controllers');
const authenticateToken = require('../middleware/authentication');

router.post('/register',
    body('name').isLength({ min: 1, max: 15 }).notEmpty(),
    body('email').isEmail().notEmpty(),
    body('password').isLength({ min: 7 }).notEmpty(),
    userController.register
)

router.post('/login',
    body('email').isEmail().notEmpty(),
    body('password').isLength({ min: 7 }).notEmpty(),
    userController.login
)

router.post('/add_class',
    body('class_id').notEmpty(),
    authenticateToken,
    userController.add_classes
)
module.exports = router;
