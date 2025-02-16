import {create} from 'zustand'
import { axiosinstance } from '../lib/axios'
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001": "/api"

export const useAuthStore = create((set, get)=>({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async ()=>{
        try {
            const res = await axiosinstance.get('/auth/check')
            set({authUser: res.data});

            get().connectSocket();
        } 
        catch (error) {
            console.log("Error in checkAuth", error.message);
            set({authUser: null})
        }
        finally{
            set({isCheckingAuth: false})
        }
    },

    signup: async (data)=>{
        set({isSigningUp: true})
        try {
            const res = await axiosinstance.post("/auth/signup", data);
            toast.success("Account created successfully");
            set({authUser: res.data});

            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message)
        }
        finally{
            set({isSigningUp: false })
        }
    },

    login: async (data)=>{
        try {
            const res = await axiosinstance.post("/auth/login", data);
            set({authUser: res.data});
            toast.success("Logged In successfully") 

            get().connectSocket();
        } 
        catch (error) {
            console.log(error);
            toast.error(error.response.data.message)
        }
        finally{
            set({isLoggingIn: false})
        }
    },

    logout: async ()=>{
        try {
            const res = await axiosinstance.post("/auth/logout");
            set({authUser: null});
            toast.success("Logged Out successfully")

            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (data)=>{
        set({isUpdatingProfile: true});
        try {
            const res = await axiosinstance.put("/auth/update-profile", data)
            set({authUser: res.data});
            toast.success("Profile Updated successfully");
        } 
        catch (error) {
            console.log(error);
            toast.error(error.response.data.message)
        }
        finally{
            set({isUpdatingProfile: false})
        }
    },

    connectSocket: ()=>{
        const { authUser } = get();
        if(!authUser || get().socket?.connected) return ;

        const socket = io(BASE_URL, {
            query:{
                userId: authUser._id,
            }
        })
        socket.connect();

        set({ socket: socket})
        
        socket.on("getOnlineUsers", (userIds)=>{
            set({onlineUsers: userIds});
        })
    },

    disconnectSocket: ()=>{
        if(get().socket?.connected) get().socket.disconnect();
    }

}))