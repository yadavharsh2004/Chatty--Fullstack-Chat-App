import { create } from "zustand";
import { axiosinstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";


export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    getUsers: async ()=>{
        set({isUsersLoading: true});

        try {
            const res = await axiosinstance.get("/messages/users")
            set({users: res.data})
        } 
        catch (error) {
            toast.error(error.response.data.message)
        }
        finally{
            set({isUsersLoading: false})
        }
    },

    getMessages: async (userId)=>{
        set({isMessagesLoading: true})
        
        try {
            const res = await axiosinstance.get(`/messages/${userId}`)
            set({messages: res.data});
        } 
        catch (error) {
            toast.error(error.response.data.message)
        }
        finally{
            set({isMessagesLoading: false})
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosinstance.post(`/messages/send/${selectedUser._id}`, messageData);
            if (!res || !res.data) {
                toast.error("Invalid server response");
            }
            set({ messages: [...(messages || []), res.data] });
        } 
        catch (error) {
            toast.error(error.response?.data?.message);
            console.log("Error: ", error);
        }
    },

    subscribeToMessages: ()=>{
        const {selectedUser} = get();
        if(!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        //todo: optimze this later
        socket.on("newMessage", (newMessage)=>{
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if(!isMessageSentFromSelectedUser) return;
            set({messages: [...get().messages, newMessage]})
        })
    },

    unsubscribeFromMessages: ()=>{
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser })

}))