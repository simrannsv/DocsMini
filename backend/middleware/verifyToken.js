import jwt from 'jsonwebtoken'
import {config} from 'dotenv'
const {verify}=jwt
config()

export const verifyToken=(...allowerdRoles)=>{
    return(req,res,next)=>{
        try{
           const token=req.cookies?.token
           if(!token)
           {
            return res.status(401).json({message:"Please Login first"})
           }
           let decodedToken=verify(token,process.env.SECRET_KEY)
                     if(allowerdRoles.length > 0)
           {
                         if (!allowerdRoles.includes(decodedToken.role?.toUpperCase())) {
          return res.status(403).json({ message: "You are not authorized" })
        }
           }
           req.user=decodedToken
           next()
        }catch(err)
        {
            res.status(401).json({message:"Invalid token"})
        }
    }
}