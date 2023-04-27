import { authContentHeader } from "./AuthHeader.ts"

export const getFetch = async (request: string, method: string) => {

    const data = await fetch(request,
        {
            method: method,
            headers: authContentHeader(),
        });
    return data;
}

export const getFetchWithBody = async (request: string, method: string, body: any) => {

    const data = await fetch(request,
        {
            method: method,
            headers: authContentHeader(),
            body: JSON.stringify(body),
        });
    return data;
}
