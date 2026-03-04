"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { account, avatars, storage, databases } from "@/lib/appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProfileUpload from "./profileUpload";

const BUCKET_ID = process.env.NEXT_PUBLIC_BUCKET_ID!;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_ID!;

interface AppwriteUser {
  $id: string;
  name: string;
  email: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await account.get();
        setUser(res as AppwriteUser);
        setName(res.name);
        setEmail(res.email);
        await fetchUserProfile(res.$id, res.name);
      } catch {
        toast.error("Failed to load user");
      }
    };
    fetchUser();
  }, []);

  const fetchUserProfile = async (userId: string, displayName: string) => {
    try {
      const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
      if (userDoc.profileImageId) {
        const imageUrl = storage.getFilePreview(BUCKET_ID, userDoc.profileImageId, 150, 150);
        setProfileImageUrl(imageUrl);
      } else {
        setProfileImageUrl(avatars.getInitials(displayName || "User"));
      }
    } catch {
      try {
        const files = await storage.listFiles(BUCKET_ID);
        const profileFile = files.files.find(
          (file) =>
            file.name.startsWith(`profile_${userId}`) ||
            file.name === `${userId}.jpg` ||
            file.name === `${userId}.png`
        );
        if (profileFile) {
          const imageUrl = storage.getFilePreview(BUCKET_ID, profileFile.$id, 150, 150);
          setProfileImageUrl(imageUrl);
        } else {
          setProfileImageUrl(avatars.getInitials(displayName || "User"));
        }
      } catch {
        setProfileImageUrl(avatars.getInitials(displayName || "User"));
      }
    }
  };

  const handleProfileImageUpdate = async (fileId: string | null) => {
    if (fileId) {
      const imageUrl = storage.getFilePreview(BUCKET_ID, fileId, 150, 150);
      setProfileImageUrl(imageUrl);
      toast.success("Profile photo updated!");
    } else {
      setProfileImageUrl(avatars.getInitials(name || "User"));
      toast.success("Profile photo removed!");
    }
    window.dispatchEvent(new CustomEvent("profile-updated"));
  };

  const uploadProfileImage = async (file: File, userId: string) => {
    try {
      const uploadedFile = await storage.createFile(BUCKET_ID, "unique()", file);
      try {
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
          profileImageId: uploadedFile.$id,
          name,
          email,
        });
      } catch (error: unknown) {
        const appwriteError = error as { code?: number };
        if (appwriteError.code === 404) {
          await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
            userId,
            profileImageId: uploadedFile.$id,
            name,
            email,
          });
        } else {
          throw error;
        }
      }
      return uploadedFile.$id;
    } catch (error) {
      console.error("Profile upload failed:", error);
      throw error;
    }
  };

  const deleteProfileImage = async (_currentImageId: string, userId: string) => {
    try {
      let fileIdToDelete: string | null = null;
      try {
        const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
        fileIdToDelete = userDoc.profileImageId as string;
      } catch {
        const files = await storage.listFiles(BUCKET_ID);
        const profileFile = files.files.find((file) =>
          file.name.startsWith(`profile_${userId}`)
        );
        if (profileFile) {
          fileIdToDelete = profileFile.$id;
        }
      }

      if (fileIdToDelete) {
        await storage.deleteFile(BUCKET_ID, fileIdToDelete);
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
          profileImageId: null,
        });
      }
    } catch (error) {
      console.error("Profile deletion failed:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let updatesMade = false;

      if (user.name !== name) {
        await account.updateName(name);
        updatesMade = true;
      }

      if (user.email !== email) {
        if (!password) {
          toast.error("Password is required to update email");
          setLoading(false);
          return;
        }
        await account.updateEmail(email, password);
        updatesMade = true;
      }

      try {
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id, {
          name,
          email,
        });
      } catch (err: unknown) {
        const appwriteError = err as { code?: number };
        if (appwriteError.code === 404) {
          await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id, {
            userId: user.$id,
            name,
            email,
            profileImageId: null,
          });
        }
      }

      if (updatesMade) {
        toast.success("Profile updated successfully!");
        const updatedUser = await account.get();
        setUser(updatedUser as AppwriteUser);
      } else {
        toast.info("No changes to save");
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Profile Photo Section */}
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Profile Photo
          </h3>
          <div className="flex items-center gap-5">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                width={80}
                height={80}
                className="rounded-full object-cover border-4 border-border shadow"
                alt="Profile"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-border">
                <span className="text-2xl font-bold text-primary">
                  {name.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            )}
            <ProfileUpload
              userId={user?.$id}
              currentImageUrl={profileImageUrl}
              onImageUpdate={handleProfileImageUpdate}
              uploadFunction={uploadProfileImage}
              deleteFunction={deleteProfileImage}
            />
          </div>
        </div>

        {/* Account Details Section */}
        <div className="p-6 space-y-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Account Details
          </h3>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-foreground">
              Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-foreground">
              Email
            </label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-foreground">
              Current Password
            </label>
            <p className="text-xs text-muted-foreground mb-1.5">Required only when changing email</p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter current password to change email"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
