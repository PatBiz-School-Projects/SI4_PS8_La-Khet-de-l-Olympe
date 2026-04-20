import {API_URL} from  "env.js";

export async function apiFetch(url,options={}) {
    return await fetch(API_URL+url,options);
}
