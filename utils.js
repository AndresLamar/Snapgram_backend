import sharp from 'sharp';
import { createRequire } from 'node:module'
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config.js";
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from "./config.js";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
})

export async function uploadImage({ filePath, folder }){

    const result = await cloudinary.uploader.upload(filePath,{
        folder: folder
    })

    // Obtener la URL de la imagen y extraer la parte de la versión
    const urlParts = result.secure_url.split('/v');
    const baseUrl = urlParts[0];
    const version = urlParts[1];

    // Construir la URL optimizada con los parámetros de optimización
    const optimizedUrl = `${baseUrl}/q_auto,f_auto/v${version}`;

    result.optimizedUrl = optimizedUrl
 
    return result
    
}

export async function deleteImage (publicId){
    return await cloudinary.uploader.destroy(publicId)
}

export async function optimizeImage(inputPath, outputPath, options) {
    try {
        // Optimizar la imagen utilizando Sharp
        await sharp(inputPath)
            .resize(options.height)
            // .toFormat(options.format, { quality: options.quality })
            .toFile(outputPath);

        console.log('Image optimized successfully');
    } catch (error) {
        console.error('Error optimizing image:', error);
        throw new Error('Error optimizing image');
    }
}

const require = createRequire(import.meta.url)

export const readJSON = (path) => require(path)

export const createToken = (payload) => jwt.sign(payload, JWT_SECRET)
