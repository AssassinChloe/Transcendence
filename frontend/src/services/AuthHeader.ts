

export const authHeader = () => {
  let token = "Bearer " + JSON.parse(localStorage.getItem("token")).user.token;
  let myHeaders = new Headers();
  myHeaders.append("Authorization", token);
  return myHeaders;
};

export const authContentHeader = () => {
  let token = "bearer " + JSON.parse(localStorage.getItem("token")).user.token;
  let myHeaders = new Headers();
  myHeaders.append("Authorization", token);
  myHeaders.append("Content-Type", "application/json");
  return myHeaders;
};
