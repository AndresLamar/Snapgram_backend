export class UploadController{
    constructor ({ uploadModel }) {
        this.uploadModel = uploadModel
      } 

    uploadPostImage = async (req, res) => {   
        if(req.files?.file == null){
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const filePath = req.files.file.tempFilePath

        const file = await this.uploadModel.uploadPostImage(filePath)

        if (file) return res.status(201).json(file)        

        res.status(400).json({ error: 'No file uploaded' })
    }

    uploadProfileImage = async (req, res) => {   
        if(req.files?.file == null){
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const filePath = req.files.file.tempFilePath

        const file = await this.uploadModel.uploadProfileImage(filePath)

        if (file) return res.status(201).json(file)        

        res.status(400).json({ error: 'No file uploaded' })
    }

    deleteImage = async (req, res) => {
        const { fileId } = req.body

        await this.uploadModel.delete( fileId )

        res.status(204)
    }
}