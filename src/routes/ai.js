import {Router} from "express";
import rateLimit from "express-rate-limit";
import {z} from "zod";
import {generateScenarios} from "../services/ai-scenarios.js";
const r=Router();
const limiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:"draft-8",legacyHeaders:false});
const schema=z.object({
  description:z.string().trim().min(20).max(5000),
  roles:z.array(z.string().trim().min(1).max(80)).max(15).default([]),
  workflows:z.array(z.string().trim().min(1).max(200)).max(20).default([])
});
r.post("/scenarios",limiter,async(req,res)=>{
  const parsed=schema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Provide a system description of 20–5000 characters and valid role/workflow lists.",details:parsed.error.flatten()});
  const result=await generateScenarios(parsed.data);
  res.json(result);
});
export default r;