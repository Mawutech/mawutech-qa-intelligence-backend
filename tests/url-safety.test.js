import test from "node:test";
import assert from "node:assert/strict";
import {validateTestUrl} from "../src/services/url-safety.js";
process.env.TEST_ALLOWED_HOSTS="qa.example.com,staging.example.org";
test("allows an exact authorized HTTPS hostname",()=>{assert.equal(validateTestUrl("https://qa.example.com/path"),"https://qa.example.com/path");});
test("rejects hostnames not in the allowlist",()=>{assert.throws(()=>validateTestUrl("https://evil.example.com"),/not in TEST_ALLOWED_HOSTS/);});
test("rejects localhost and local suffixes",()=>{assert.throws(()=>validateTestUrl("http://localhost"),/Local\/private/);assert.throws(()=>validateTestUrl("http://printer.local"),/Local\/private/);});
test("rejects private IP literals",()=>{assert.throws(()=>validateTestUrl("http://192.168.1.10"),/Local\/private/);assert.throws(()=>validateTestUrl("http://10.0.0.2"),/Local\/private/);});
test("rejects non HTTP protocols and embedded credentials",()=>{assert.throws(()=>validateTestUrl("file:///etc/passwd"),/HTTP\(S\)/);assert.throws(()=>validateTestUrl("https://user:pass@qa.example.com"),/HTTP\(S\)/);});