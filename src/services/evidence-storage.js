import {v2 as cloudinary} from "cloudinary";
let configured=false;
function getCloudinary(){
 if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)return null;
 if(!configured){cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET,secure:true});configured=true;}
 return cloudinary;
}
export async function uploadScreenshot(buffer,publicId){
 const client=getCloudinary();if(!client||!buffer?.length)return null;
 return new Promise(resolve=>{
  const stream=client.uploader.upload_stream({folder:process.env.CLOUDINARY_EVIDENCE_FOLDER||"mawutech-qa-intelligence/evidence",public_id:publicId,resource_type:"image",overwrite:false},(error,result)=>resolve(error?null:result?.secure_url||null));
  stream.end(buffer);
 });
}