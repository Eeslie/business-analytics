export async function requestData(
    url: string, 
    method: string, 
    headers?: Record<any, any>, 
    body?: Record<any, any>
) {
    console.log('Endpoint:', url);
    console.log('Method:', method);
    console.log('Headers:', headers);
    console.log('Body', body);
    
    const res = await fetch(url, {
        method: method,
        headers: headers ?? { "Content-Type": "application/json"},
        body: body && JSON.stringify(body),
    });

    const response = await res.json();

    if (!res.ok) {
        throw new Error(response.message || response.error || 'Something went wrong.');
    }

    console.log('Response Body:', response);
    
    return await response;
}