import { test } from 'node:test'
import assert from 'node:assert/strict'
import { copyText } from '../src/lib/clipboard.ts'

const shopLink='https://gulako.site/cosmeticshub'

function installBrowser(t,{writeText,legacyResult=true}={}){
  const calls={removed:false,restored:false,copied:''}
  class Element{focus(){calls.restored=true}}
  const field={style:{},select(){},setSelectionRange(){},remove(){calls.removed=true}}
  const previousSelection={id:'selected text'}
  const selection={rangeCount:1,getRangeAt:()=>previousSelection,removeAllRanges(){},addRange(range){assert.equal(range,previousSelection)}}
  const globals={
    HTMLElement:Element,
    navigator:{clipboard:writeText?{writeText}:undefined},
    window:{getSelection:()=>selection},
    document:{activeElement:new Element(),body:{append(element){assert.equal(element,field)}},createElement:()=>field,execCommand(command){assert.equal(command,'copy');calls.copied=field.value;return legacyResult}},
  }
  for(const [key,value] of Object.entries(globals)){
    const descriptor=Object.getOwnPropertyDescriptor(globalThis,key)
    Object.defineProperty(globalThis,key,{value,configurable:true,writable:true})
    t.after(()=>descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key])
  }
  return calls
}

test('copies the complete public shop URL with the Clipboard API',async t=>{
  let copied=''
  const calls=installBrowser(t,{writeText:async value=>{copied=value}})
  await copyText(shopLink)
  assert.equal(copied,shopLink)
  assert.equal(calls.copied,'')
})

test('copies with the browser fallback when the Clipboard API is missing or denied',async t=>{
  for(const writeText of [undefined,async()=>{throw new Error('Permission denied')}]){
    await t.test(writeText?'denied':'unavailable',async t=>{
      const calls=installBrowser(t,{writeText})
      await copyText(shopLink)
      assert.equal(calls.copied,shopLink)
      assert.equal(calls.removed,true)
      assert.equal(calls.restored,true)
    })
  }
})

test('reports a failed copy and cleans up when both browser methods are blocked',async t=>{
  const calls=installBrowser(t,{writeText:async()=>{throw new Error('Permission denied')},legacyResult:false})
  await assert.rejects(copyText(shopLink),/Copy is unavailable/)
  assert.equal(calls.removed,true)
  assert.equal(calls.restored,true)
})
