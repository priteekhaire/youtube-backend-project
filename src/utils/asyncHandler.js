const ascyncHandler=(requestHandler)=>{
(req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)) .catch((error)=> next(error))
}

}
export default  asyncHandler















    //     const ascyncHandler=(fn) => async(req, res, next) => {
//   try{

//   await fn(req, res, next);
//   }

//   catch(error){
//  res.status(err.code || 500).json ({
//     success: false,
//     message: error.message 
// })
// }
// }