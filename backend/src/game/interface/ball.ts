export default interface Ball
{
    radius: number;
    x: number;
    y: number;
    speed_x: number;
    speed_y: number;
    speed_max: number;
    primary : string;
    secondary : string;
    background : string;
    start : number;
    duration:number;
    norminet:boolean;
};