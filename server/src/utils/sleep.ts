
export const sleep = (ms: number) => new Promise(resolve =>{
    return setTimeout(resolve, ms)
})