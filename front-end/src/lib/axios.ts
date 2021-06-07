import axios from "axios";
import EventEmitter from "./EventEmitter";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
});

const handleAuthenticated = (token: any) => {
  axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

EventEmitter.on("authenticated", handleAuthenticated);

export default axiosInstance;
