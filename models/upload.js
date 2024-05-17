import { deleteImage, uploadImage } from "../utils.js";
import { unlink } from "node:fs/promises";

export class UploadModel {
  static async uploadPostImage  ( filePath )  {
 
    try {

      const result = await uploadImage({ filePath, folder: "snapgram_posts" })

      await unlink(filePath)

      return result

    } catch (error) {
        console.log(error);
        return null
    }
  }

  static async uploadProfileImage  ( filePath )  {

    try {

      const result = await uploadImage({ filePath, folder: "snapgram_profile_images" })

      await unlink(filePath)

      return result

    } catch (error) {
        console.log(error);
        return null
    }
  }

  static async delete (fileId){
    try {
      await deleteImage(fileId)
    } catch (error) {
      console.log(error)
    }
  }
}


