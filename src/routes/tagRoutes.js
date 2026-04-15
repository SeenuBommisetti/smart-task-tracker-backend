const express = require('express');

const tagController = require('../controllers/tagController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  tagIdValidator,
  createTagValidator,
  updateTagValidator
} = require('../validators/tagValidators');

const router = express.Router();

router.use(authenticate);

router.get('/', tagController.listTags);
router.post('/', createTagValidator, validate, tagController.createTag);
router.put('/:tagId', updateTagValidator, validate, tagController.updateTag);
router.delete('/:tagId', tagIdValidator, validate, tagController.deleteTag);

module.exports = router;
