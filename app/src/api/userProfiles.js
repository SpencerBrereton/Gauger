import client from "./client";

export const getUserProfile = () => client.get("/user_profile");
export const updateUserProfile = (data) => {
    if (data instanceof FormData) {
        return client.put("/user_profile", data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    }
    return client.put("/user_profile", { user_profile: data });
};
