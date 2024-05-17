export class LoginController{
    constructor ({ loginModel }) {
        this.loginModel = loginModel
      }

    login = async (req, res) => { 
        const user = await this.loginModel.login(req.body)

        if (!(user )) {
            return res.status(401).json({
                error: 'Invalid username or password. Please try again.'
            })
        }

        res.json(user)
    }
}