import {chromium} from "playwright";
import {validateTestUrl,assertPublicHost} from "./url-safety.js";
function resolveLocator(page,spec){
 const {by,value,role}=spec;
 if(by==="role"){if(!role)throw new Error("Role locator requires a role name");return page.getByRole(role,{name:value});}
 if(by==="label")return page.getByLabel(value);
 if(by==="placeholder")return page.getByPlaceholder(value);
 if(by==="text")return page.getByText(value,{exact:true});
 if(by==="testId")return page.getByTestId(value);
 if(by==="css")return page.locator(value);
 throw new Error("Unsupported locator type");
}
export async function runScenarioTest(rawUrl,scenario){
 const url=validateTestUrl(rawUrl);await assertPublicHost(url);
 if(!Array.isArray(scenario.actions)||scenario.actions.length<1||scenario.actions.length>30)
  throw Object.assign(new Error("Scenario has no valid executable actions"),{status:400});
 const browser=await chromium.launch({headless:process.env.PLAYWRIGHT_HEADLESS!=="false"});
 const page=await browser.newPage(),consoleErrors=[],pageErrors=[],started=Date.now();
 let response=null,completed=0,failureMessage=null;
 try{
  page.on("console",m=>{if(m.type()==="error"&&consoleErrors.length<50)consoleErrors.push(m.text().slice(0,500));});
  page.on("pageerror",e=>{if(pageErrors.length<50)pageErrors.push(e.message.slice(0,500));});
  await page.route("**/*",async route=>{
   try{const target=route.request().url();if(!target.startsWith("http://")&&!target.startsWith("https://"))return await route.abort();await assertPublicHost(target);await route.continue();}
   catch{return await route.abort();}
  });
  response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  if(response&&response.status()>=400)throw new Error("Initial page returned HTTP "+response.status());
  const origin=new URL(url).origin;
  for(const [index,action] of scenario.actions.entries()){
   if(!action||typeof action!=="object"||typeof action.type!=="string")throw new Error("Invalid action at step "+(index+1));
   const target=action.locator?resolveLocator(page,action.locator):null;
   switch(action.type){
    case "navigate":{
     if(typeof action.path!=="string"||!action.path.startsWith("/")||action.path.startsWith("//"))throw new Error("Navigation must use a same-site relative path");
     await page.goto(new URL(action.path,origin).toString(),{waitUntil:"domcontentloaded",timeout:20000});break;
    }
    case "click":await target.click({timeout:8000});break;
    case "fill":await target.fill(String(action.value??""),{timeout:8000});break;
    case "selectOption":await target.selectOption(String(action.value??""),{timeout:8000});break;
    case "check":await target.check({timeout:8000});break;
    case "uncheck":await target.uncheck({timeout:8000});break;
    case "expectVisible":await target.waitFor({state:"visible",timeout:8000});break;
    case "expectText":await target.waitFor({state:"visible",timeout:8000});if(!await target.innerText().then(t=>t.includes(String(action.value??""))))throw new Error("Expected text was not found: "+String(action.value).slice(0,120));break;
    case "expectUrl":if(typeof action.value!=="string"||!action.value.startsWith("/")||action.value.startsWith("//"))throw new Error("URL assertions must use a same-site relative path");if(new URL(page.url()).pathname!==action.value)throw new Error("Expected URL "+action.value+" but received "+new URL(page.url()).pathname);break;
    default:throw new Error("Unsupported action type: "+action.type);
   }
   completed++;
  }
  return {status:"passed",title:await page.title(),finalUrl:page.url(),httpStatus:response?.status()??null,durationMs:Date.now()-started,consoleErrors,pageErrors,failureMessage:null,completedSteps:completed,totalSteps:scenario.actions.length};
 }catch(error){
  failureMessage=error.message.slice(0,1000);
  return {status:"failed",title:await page.title().catch(()=>null),finalUrl:page.url(),httpStatus:response?.status()??null,durationMs:Date.now()-started,consoleErrors,pageErrors,failureMessage,completedSteps:completed,totalSteps:scenario.actions.length};
 }finally{await browser.close();}
}