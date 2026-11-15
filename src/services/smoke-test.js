import {chromium} from "playwright";
import {validateTestUrl,assertPublicHost} from "./url-safety.js";
export async function runSmokeTest(raw){
  const url=validateTestUrl(raw);
  await assertPublicHost(url);
  const browser=await chromium.launch({headless:process.env.PLAYWRIGHT_HEADLESS!=="false"});
  const page=await browser.newPage();
  const consoleErrors=[],pageErrors=[];
  const started=Date.now();let response;
  try{
    page.on("console",m=>{if(m.type()==="error")consoleErrors.push(m.text().slice(0,500));});
    page.on("pageerror",e=>pageErrors.push(e.message.slice(0,500)));
    await page.route("**/*",async route=>{
      try{
        const target=route.request().url();
        if(!target.startsWith("http://")&&!target.startsWith("https://"))return await route.abort();
        await assertPublicHost(target);
        await route.continue();
      }catch{return await route.abort();}
    });
    response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
    return {status:response&&response.status()<400&&pageErrors.length===0?"passed":"failed",title:await page.title(),finalUrl:page.url(),httpStatus:response?.status()??null,durationMs:Date.now()-started,consoleErrors:consoleErrors.slice(0,50),pageErrors:pageErrors.slice(0,50),failureMessage:response&&response.status()>=400?`HTTP ${response.status()}`:null};
  }catch(e){
    return {status:"failed",title:null,finalUrl:page.url(),httpStatus:response?.status()??null,durationMs:Date.now()-started,consoleErrors:consoleErrors.slice(0,50),pageErrors:pageErrors.slice(0,50),failureMessage:e.message.slice(0,1000)};
  }finally{await browser.close();}
}