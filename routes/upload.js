import { Router } from 'express'
import { UploadController } from '../controllers/upload.js'
import { tokenExtractor  } from "../middlewares/token.js";


export const createUploadRouter = ({ uploadModel }) => {
  const uploadRouter = Router()

  const uploadController = new UploadController({ uploadModel })

  uploadRouter.post('/PostImage', tokenExtractor, uploadController.uploadPostImage)
  uploadRouter.post('/ProfileImage', tokenExtractor, uploadController.uploadProfileImage)
  uploadRouter.delete('/deleteImage', tokenExtractor, uploadController.deleteImage)

  

  return uploadRouter
}
