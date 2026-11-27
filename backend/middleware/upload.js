const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024,
        file: 1,
        fields: 12,
        fieldSize: 10 * 1024
    }
});

function uploadProductImage(req,res,next) {
    upload.single('item_image')(req,res, (error) => {
        if(!error) return next();

        if(error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({message: 'La imagen supera los 2 MB.'}) ;
        }
        return res.status(400).json({message: 'No se pudo procesar el formulario.'});
    });
}

module.exports = { uploadProductImage};
