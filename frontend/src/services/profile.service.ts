import { authContentHeader, authHeader } from "./AuthHeader.ts"

export const followProfile = (otherUsername: string) => {
    const url= otherUsername + "/follow"
    return fetchQuery(url, "POST", null)
}

export const unfollowProfile = (otherUsername: string) => {
  const url= otherUsername + "/follow"
  return fetchQuery(url, "DELETE", null)
}

export const getUserById = (otherUsername: string) => {
    return fetchQuery(otherUsername, "GET", storeProfile);
};

export const getAllBuddies = () => {
    let username = JSON.parse(localStorage.getItem("token")).user.username;
    if (username)
        return fetchQuery("friends", "GET", null);

}

const fetchQuery = async (url: string, method: string, result: any) => {
    let fetchUrl = `http://${process.env.REACT_APP_ADDRESS}:7001` + "/profile/" + url;
    try {
      const response = await fetch(fetchUrl, {
        method: method,
        headers: authContentHeader(),
        body: null,
        redirect: "follow",
      });
      const result = await response.json();
      if (!response.ok) {
        return "error";
      }
      return result;
    } catch (error) {
      return "error";
    }
  };

  
  export const storeProfile = (result: any) => {
    return result;
  };
  