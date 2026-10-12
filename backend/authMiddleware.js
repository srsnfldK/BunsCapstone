const { getAuth } = require("firebase-admin/auth");
require("./firebaseAdmin");

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized. Please log in."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired authentication token."
    });
  }
}

module.exports = verifyToken;