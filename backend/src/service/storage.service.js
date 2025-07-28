const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
});


// function uploadFile((file) => {
//     return new Promise((resolve, reject) => {
        
//     })
// })
// This function upload audio at ImageKit
function uploadFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        // Validate file type
        const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'video/mp4', 'video/mpeg'];
        if (!allowedTypes.includes(file.mimetype)) {
            reject(new Error('Invalid file type. Only audio and video files are allowed.'));
            return;
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB in bytes
        if (file.size > maxSize) {
            reject(new Error('File too large. Maximum size is 50MB.'));
            return;
        }
        
        imagekit.upload({
            file: file.buffer,
            fileName: `song_${Date.now()}_${file.originalname || 'audio'}`,
            folder: '/songs'
        }, (error, result) => {
            if (error) {
                console.error('ImageKit upload error:', error);
                reject(new Error('Failed to upload file to storage service'));
            } else {
                resolve(result);
            }
        });
    });
}
module.exports = uploadFile;
