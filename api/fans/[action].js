import {
  handleFanLogin,
  handleFanLogout,
  handleFanMe,
  handleFanPoints,
  handleFanSignup,
} from "../../lib/fanAuthApi.js";

const routes = {
  signup: handleFanSignup,
  login: handleFanLogin,
  logout: handleFanLogout,
  me: handleFanMe,
  points: handleFanPoints,
};

export default async function handler(req, res) {
  const action = req.query.action;
  const fn = routes[action];
  if (!fn) {
    return res.status(404).json({ error: "Unknown fan action" });
  }
  return fn(req, res);
}
