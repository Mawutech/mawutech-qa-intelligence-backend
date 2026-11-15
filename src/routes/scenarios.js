import {Router} from "express";
import {z} from "zod";
import {prisma} from "../lib/prisma.js";
const r=Router();
const locator=z.object({by:z.enum(["role","label","placeholder","text","testId","css"]),value:z.string().min(1).max(300),role:z.string().max(60).optional()});
const action=z.discriminatedUnion("type",[
 z.object({type:z.literal("navigate"),path:z.string().startsWith("/").max(500)}),
 z.object({type:z.enum(["click","check","uncheck","expectVisible"]),locator}),
 z.object({type:z.literal("fill"),locator,value:z.string().max(1000)}),
 z.object({type:z.literal("selectOption"),locator,value:z.string().max(200)}),
 z.object({type:z.literal("expectText"),locator,value:z.string().max(500)}),
 z.object({type:z.literal("expectUrl"),value:z.string().startsWith("/").max(500)})
]);
const scenario=z.object({
 title:z.string().trim().min(4).max(160),
 priority:z.enum(["critical","high","medium","low"]),
 category:z.enum(["authentication","authorization","functional","validation","workflow","usability","accessibility","data-integrity"]),
 preconditions:z.array(z.string().min(1).max(300)).max(8),
 steps:z.array(z.string().min(1).max(500)).min(1).max(12),
 expectedResults:z.array(z.string().min(1).max(500)).min(1).max(12),
 actions:z.array(action).min(1).max(30)
});
r.get("/",async(req,res)=>{
 const project=await prisma.project.findUnique({where:{id:req.params.projectId},select:{id:true}});
 if(!project)return res.status(404).json({error:"Project not found"});
 const scenarios=await prisma.testScenario.findMany({where:{projectId:project.id},orderBy:{createdAt:"desc"}});
 res.json({scenarios});
});
r.post("/",async(req,res)=>{
 const project=await prisma.project.findUnique({where:{id:req.params.projectId},select:{id:true}});
 if(!project)return res.status(404).json({error:"Project not found"});
 const parsed=scenario.safeParse(req.body);
 if(!parsed.success)return res.status(400).json({error:"Invalid test scenario",details:parsed.error.flatten()});
 const saved=await prisma.testScenario.create({data:{...parsed.data,projectId:project.id}});
 res.status(201).json({scenario:saved});
});
r.patch("/:scenarioId/status",async(req,res)=>{
 const parsed=z.object({status:z.enum(["draft","approved","archived"])}).safeParse(req.body);
 if(!parsed.success)return res.status(400).json({error:"Status must be draft, approved, or archived"});
 const existing=await prisma.testScenario.findFirst({where:{id:req.params.scenarioId,projectId:req.params.projectId}});
 if(!existing)return res.status(404).json({error:"Scenario not found"});
 const updated=await prisma.testScenario.update({where:{id:existing.id},data:{status:parsed.data.status}});
 res.json({scenario:updated});
});
export default r;