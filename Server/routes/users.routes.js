const express = require('express');
const router = express.Router();
const { body } = require('express-validator')
const userController = require('../controllers/users.controllers');
const authenticateToken = require('../middleware/authentication');

router.post('/register',
    body('name').isLength({ min: 1, max: 15 }).notEmpty(),
    body('email').isEmail().notEmpty(),
    body('password').isLength({ min: 7 }).notEmpty(),
    body('year').isArray().notEmpty(),
    body('dep').notEmpty(),
    body('role').isIn(['teacher', 'student', 'admin']).notEmpty(),
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

router.post('/create_class',
    body('class_name').notEmpty(),
    body('year').notEmpty(),
    authenticateToken,
    userController.create_class
)

router.get('/classes',
    authenticateToken,
    userController.get_classes_by_teacher
)

router.get('/student/classes',
    authenticateToken,
    userController.get_classes_by_student
)

router.get('/enrolled-classes',
    authenticateToken,
    userController.get_enrolled_classes
)

router.get('/profile',
    authenticateToken,
    userController.get_profile
)
module.exports = router;
