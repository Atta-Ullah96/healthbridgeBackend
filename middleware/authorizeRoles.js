export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    const adminRole = req.admin.roles;

    const hasAccess = allowedRoles.includes(adminRole);

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have permission to perform this action"
      });
    }

    next();
  };
};