function requireLogin(req,res,next){
    if(!req.session.userId) {
        return res.status(401).json({messsage: 'Debes iniciar sesion'});
    }
    next();
}

function requireLoginPage(req,res,next){
    if (req.session.userId) return next();

    const redirect = encodeURIComponent(req.originalUrl);
    res.redirect(`/modules/login/index_login.html?redirect=${redirect}`);
}

module.exports = {requireLogin, requireLoginPage};