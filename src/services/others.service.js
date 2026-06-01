// lead-->source
export const fetchSources = async () => {
    const token = localStorage.getItem("auth_token")
    const res = await fetch(`https://gateway.aajneetiadvertising.com/Admin/fieldManager/Lead/source`, {
        method: 'GET',
        headers: {
            "Content-type": "application/json",
            token: token
        }
    });
    console.log(res);
    if (!res.ok) {
        console.log('status', res.status);
        if (res.status == 401 && res.status == 403) {
            localStorage.clear();
            window.location.href = '/login';
        }
        throw new Error("Failed to fetch accounts");

    }
    return await res.json();
}
//lead  -> status
export const fetchStatus = async () => {
    const token = localStorage.getItem("auth_token")
    const res = await fetch(`https://gateway.aajneetiadvertising.com/Admin/fieldManager/Lead/status`, {
        method: 'GET',
        headers: {
            "Content-type": "application/json",
            token: token
        }
    });
    console.log(res);
    if (!res.ok) {
        console.log('status', res.status);
        if (res.status == 401 && res.status == 403) {
            localStorage.clear();
            window.location.href = '/login';
        }
        throw new Error("Failed to fetch accounts");

    }
    return await res.json();
}
//Task -> Priority
// export const fetchStatus = async () => {
//     const token = localStorage.getItem("auth_token")
//     const res = await fetch(`https://gateway.aajneetiadvertising.com/Admin/fieldManager/Lead/status`, {
//         method: 'GET',
//         headers: {
//             "Content-type": "application/json",
//             token: token
//         }
//     });
//     console.log(res);
//     if (!res.ok) {
//         console.log('status', res.status);
//         if (res.status == 401 && res.status == 403) {
//             localStorage.clear();
//             window.location.href = '/login';
//         }
//         throw new Error("Failed to fetch accounts");

//     }
//     return await res.json();
// }
//account -> industries
export const fetchIndustries = async () => {
    const token = localStorage.getItem("auth_token")
    const res = await fetch(`https://gateway.aajneetiadvertising.com/Admin/fieldManager/Account/industry`, {
        method: 'GET',
        headers: {
            "Content-type": "application/json",
            token: token
        }
    });
    console.log(res);
    if (!res.ok) {
        console.log('status', res.status);
        if (res.status == 401 && res.status == 403) {
            localStorage.clear();
            window.location.href = '/login';
        }
        throw new Error("Failed to fetch accounts");

    }
    return await res.json();
}

//account -> types
export const fetchAccountType = async () => {
    const token = localStorage.getItem("auth_token")
    const res = await fetch(`https://gateway.aajneetiadvertising.com/Admin/fieldManager/Account/type`, {
        method: 'GET',
        headers: {
            "Content-type": "application/json",
            token: token
        }
    });
    console.log(res);
    if (!res.ok) {
        console.log('status', res.status);
        if (res.status == 401 && res.status == 403) {
            localStorage.clear();
            window.location.href = '/login';
        }
        throw new Error("Failed to fetch accounts");

    }
    return await res.json();
}
