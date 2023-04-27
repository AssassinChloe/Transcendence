import { authHeader } from "./AuthHeader.ts";


  export const getUserData = () => {
    let username = JSON.parse(localStorage.getItem("token")).user.username;
    if (username)
        return fetchQuery('user', storeUserInfo);
  };

  export const getAllUsers = () => {
    let username = JSON.parse(localStorage.getItem("token")).user.username;
    if (username)
        return fetchQuery("", storeAllUsers);
  }

  
  const fetchQuery = async (url: string, result: any) => {
    let fetchUrl = `http://${process.env.REACT_APP_ADDRESS}:7001` + "/user/" + url;
    try {
      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: authHeader(),
        body: null,
        redirect: "follow",
      });
      const result_1 = await response.json();
      if (!response.ok) {
        return "error";
      }
      return result(result_1);
    } catch (error) {
      return error;
    }
  };
  
  export const storeUserInfo = (result: any) => {
    localStorage.setItem("id", result.user.id);
    localStorage.setItem("username", result.user.username);
    localStorage.setItem("email", result.user.email);
    localStorage.setItem("avatar", result.user.avatar);
    localStorage.setItem("bio", result.user.bio);
  };

  export const storeAllUsers = (result: any) => {
    return result;
  };

  
  
  
