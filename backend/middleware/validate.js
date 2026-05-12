const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errArr = result.array();
    const errors = {};
    for (const e of errArr) {
      const field = e.path || e.param || '_';
      if (!errors[field]) errors[field] = e.msg;
    }
    return res.status(400).json({
      message: errArr.map((e) => e.msg).join(', '),
      errors,
    });
  }
  next();
};

module.exports = validate;
