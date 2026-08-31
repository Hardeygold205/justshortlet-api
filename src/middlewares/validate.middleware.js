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

    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.params !== undefined) req.params = result.data.params;

    req.validatedQuery = result.data.query;

    next();
  } catch (error) {
    next(error);
  }
};

export default validate;
