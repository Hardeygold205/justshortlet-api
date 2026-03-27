import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
} from "../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const data = await registerUser(req.validated.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = await loginUser(req.validated.body);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const data = await refreshUserToken(req.validated.body.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await logoutUser(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
