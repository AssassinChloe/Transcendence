export default class User
{
    id: number;
    username: string;
    loginname: string,
    email: string;
    bio: string;
    avatar: string;
    NbGamesPlayed: number;
    NbGamesWon: number;
    NbGamesLost: number;
    Score: number; 
    Connected: boolean;
    Followed: boolean;
    Enable2FA: boolean;
    Valid2FA: boolean;
    firstConnect: boolean;

     
    constructor( 
        id: number, 
        username: string, 
        loginname: string,
        email: string, 
        bio: string, 
        avatar: string, 
        NbGamesPlayed: number, 
        NbGamesWon: number, 
        NbGamesLost: number, 
        Score: number, 
        Connected: boolean,
        Followed: boolean,
        Enable2FA: boolean,
        Valid2FA: boolean,
        firstConnect: boolean)
    {
     // 3. Initialisation des propiétés d'un user.
     this.id = id;
     this.username = username;
     this.loginname = loginname;
     this.email = email;
     this.bio = bio;
     this.avatar = avatar;
     this.NbGamesPlayed = NbGamesPlayed;
     this.NbGamesWon = NbGamesWon;
     this.NbGamesLost = NbGamesLost;
     this.Score = Score; 
     this.Connected = Connected;
     this.Followed = Followed;
     this.Enable2FA = Enable2FA;
     this.Valid2FA = Valid2FA;
     this.firstConnect = firstConnect
    
    };

   }