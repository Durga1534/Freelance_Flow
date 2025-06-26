"use client";

import { useEffect, useState } from "react";
import { account, avatars, storage, databases } from "@/lib/appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProfileUpload from "./profileUpload";

const BUCKET_ID = process.env.NEXT_PUBLIC_BUCKET_ID!;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!; 
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_ID!;

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await account.get();
        setUser(res);
        setName(res.name);
        setEmail(res.email);
        
        await fetchUserProfile(res.$id);
      } catch (err) {
        console.error("Failed to load user:", err);
        toast.error("Failed to load user");
      }
    };
    fetchUser();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
      if (userDoc.profileImageId) {
        const imageUrl = storage.getFilePreview(BUCKET_ID, userDoc.profileImageId, 150, 150);
        setProfileImageUrl(imageUrl.href);
      } else {
        setProfileImageUrl(avatars.getInitials(name || "User").href);
      }
    } catch (err) {
      console.log("No profile found in database, checking for files...");
      
      try {
        const files = await storage.listFiles(BUCKET_ID);
        const profileFile = files.files.find(file => 
          file.name.startsWith(`profile_${userId}`) || 
          file.name === `${userId}.jpg` ||
          file.name === `${userId}.png`
        );
        
        if (profileFile) {
          const imageUrl = storage.getFilePreview(BUCKET_ID, profileFile.$id, 150, 150);
          setProfileImageUrl(imageUrl.href);
        } else {
          // Use avatar initials as fallback
          setProfileImageUrl(avatars.getInitials(name || "User").href);
        }
      } catch (err) {
        console.log("No profile image found, using initials");
        setProfileImageUrl(avatars.getInitials(name || "User").href);
      }
    }
  };

  const handleProfileImageUpdate = async (fileId: string | null) => {
    if (fileId) {
      const imageUrl = storage.getFilePreview(BUCKET_ID, fileId, 150, 150);
      setProfileImageUrl(imageUrl.href);
      toast.success("Profile photo updated!");
    } else {
      setProfileImageUrl(avatars.getInitials(name || "User").href);
      toast.success("Profile photo removed!");
    }
    
    window.dispatchEvent(new CustomEvent('profile-updated'));
  };

  const uploadProfileImage = async (file: File, userId: string) => {
    try {
      const uploadedFile = await storage.createFile(BUCKET_ID, 'unique()', file);
      
      try {
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
          profileImageId: uploadedFile.$id,
          name: name, 
          email: email
        });
      } catch (error: any) {
        
        if (error.code === 404) {
          await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
            userId: userId,
            profileImageId: uploadedFile.$id,
            name: name,
            email: email
          });
        } else {
          throw error;
        }
      }
      
      return uploadedFile.$id;
    } catch (error) {
      console.error('Profile upload failed:', error);
      throw error;
    }
  };

  const deleteProfileImage = async (currentImageId: string, userId: string) => {
    try {
      let fileIdToDelete = null;
      
      try {
        const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
        fileIdToDelete = userDoc.profileImageId;
      } catch (err) {
        const files = await storage.listFiles(BUCKET_ID);
        const profileFile = files.files.find(file => 
          file.name.startsWith(`profile_${userId}`)
        );
        if (profileFile) {
          fileIdToDelete = profileFile.$id;
        }
      }

      if (fileIdToDelete) {
        await storage.deleteFile(BUCKET_ID, fileIdToDelete);
        
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
          profileImageId: null
        });
      }
    } catch (error) {
      console.error('Profile deletion failed:', error);
      throw error;
    }
  };

  const handleSave = async () => {
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

      if (user) {
        try {
          await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id, {
            name: name,
            email: email
          });
        } catch (err: any) {
          if (err.code === 404) {
            await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id, {
              userId: user.$id,
              name: name,
              email: email,
              profileImageId: null
            });
          }
        }
      }

      if (updatesMade) {
        toast.success("Profile updated successfully!");
        const updatedUser = await account.get();
        setUser(updatedUser);
      } else {
        toast.info("No changes to save");
      }
    } catch (err: any) {
      console.error("Update failed:", err);
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 p-6 bg-white shadow-sm border rounded-lg">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Profile Photo Section */}
      <div className="text-center">
        <label className="block mb-4 font-medium">Profile Photo</label>
        <div className="flex flex-col items-center space-y-4">
          {profileImageUrl && (
            <img 
              src={profileImageUrl} 
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-lg" 
              alt="Profile" 
            />
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

      <div>
        <label className="block mb-1 font-medium">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label className="block mb-1 font-medium">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div>
        <label className="block mb-1 font-medium">Password (required to update email)</label>
        <Input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter current password to change email"
        />
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
