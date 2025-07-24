class ApiRsponse{
    constructor(res,data,message="Request was successful",){
  this.statusCode=statusCode,
  this.data=data;
    this.message=message;
    this.success=statusCode<400;
}
}