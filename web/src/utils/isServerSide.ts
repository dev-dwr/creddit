export const isServer = () => typeof window === "undefined";
//if window is undefined we are on the server, if it is active it is not on the server
