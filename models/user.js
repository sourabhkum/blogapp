const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcrypt');
const _=require('lodash');

var UserSchema= new mongoose.Schema({

    firstName:{
        type:String,
        required:true,
        minlength:2,
        trim:true
    },
    lastName:{
        type:String,
        required:true,
        minlength:3,
        trim:true
    },
    mobile:{
        type:Number,
        required:true,
        trim:true,
        minlenght:10
    },
    email:{
        type:String,
        required:true,
        minlenght:6,
        trim:true,
        unique:true,
        validate:{
            validator:validator.isEmail,
            message:'{VALUE} is not Valid',
            isAsync:false
        }
    },
    password:{
        type:String,
        required:true,
        minlength:6
    },
    tokens:[{
        access:{
            type:String,
            require:true
        },
        token:{
            type:String,
            require:true
        }

    }]
});

UserSchema.methods.toJSON=function(){
    var user=this;
    var userObject=user.toObject();
    return _.pick(userObject,['_id','email','firstName','lastName','mobile']);
};
UserSchema.pre('save',function(next){
    var user=this;
    if(user.isModified('password')){
        bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(user.password,salt,(err,hash)=>{
                user.password=hash;
                next();
            });
            
        });
    }else{
        next();
    }
});
UserSchema.statics.findByCredentials=function(email,password){
    
        var user=this;
        return User.findOne({email}).then((user)=>{
            if(!user){
                return Promise.reject;
            }
            return new Promise((resolve,reject)=>{
                bcrypt.compare(password,user.password,(err,res)=>{
                    if(res){
                        resolve(user);
                    }else{
                        reject();
                    }
                })
            });
        });
    };

var User=mongoose.model('User',UserSchema);
module.exports={User};