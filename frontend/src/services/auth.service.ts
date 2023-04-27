
class AuthService {

  logout() {
    localStorage.removeItem("token");
    localStorage.clear();
  }

  getCurrentUser() {
    let userStr = localStorage.getItem("token");
    if (userStr != null) {
      if (JSON.stringify(userStr) != '"[object Object]"')
        return JSON.parse(userStr)
    }
    
    return null;
  }
}

export default new AuthService();