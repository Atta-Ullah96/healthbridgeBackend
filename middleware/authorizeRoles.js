export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    const adminRoles = req.admin.roles;
    if(!adminRoles){
      return res.status(404).json({success:false , message : "roles not found"})
    }

    // Check if at least one of the admin's roles is included in the allowedRoles
    const hasAccess = adminRoles.some(role =>
      allowedRoles.includes(role)
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have permission to perform this action"
      });
    }

    next();
  };
};