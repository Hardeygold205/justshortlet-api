import { STATUS_CODES } from "../constants/statusCode.js";

const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten(),
      });
    }

    req.validated = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

export default validate;
