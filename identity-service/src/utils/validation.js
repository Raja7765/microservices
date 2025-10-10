const joi = require('joi')


const validateRegistration = (date)=> {
    const schema = Joioi.object({
        username : Joi.string().min(3).max(50).required(),
        email : Joi.string().email().required(),
        password : Joi.string().min(6).required()
    })

    return schema.validate(date)
}

module.exports = {validateRegistration}