import { account } from "./appwrite";

export const appwriteAuth = {
  // Register new user
  async register(email: string, password: string, name: string) {
    if (!account) throw new Error("Appwrite not configured");
    try {
      const response = await account.create("unique()", email, password, name);
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Login user
  async login(email: string, password: string) {
    if (!account) throw new Error("Appwrite not configured");
    try {
      const session = await account.createEmailPasswordSession(
        email,
        password
      );
      return session;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Get current user
  async getUser() {
    if (!account) throw new Error("Appwrite not configured");
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    if (!account) throw new Error("Appwrite not configured");
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(name?: string, password?: string) {
    if (!account) throw new Error("Appwrite not configured");
    try {
      if (name) {
        await account.updateName(name);
      }
      if (password) {
        await account.updatePassword(password);
      }
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      await this.getUser();
      return true;
    } catch {
      return false;
    }
  },
};
