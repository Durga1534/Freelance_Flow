import { storage, databases } from './appwrite';

// Configuration
const BUCKET_ID = process.env.NEXT_PUBLIC_BUCKET_ID!;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!; 
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_ID!;

// Upload profile image
export const uploadProfileImage = async (file, userId) => {
  try {
    
    const uploadedFile = await storage.createFile(BUCKET_ID, 'unique()', file);
    
   
    try {
      await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
        profileImageId: uploadedFile.$id
      });
    } catch (error) {
      if (error.code === 404) {
        await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
          userId: userId,
          profileImageId: uploadedFile.$id
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

// Get profile image URL
export const getProfileImageUrl = (fileId, width = 100, height = 100) => {
  if (!fileId) return null;
  try {
   
    const viewUrl = storage.getFileView(BUCKET_ID, fileId);
    return viewUrl.href || viewUrl; 
  } catch (error) {
    console.error('Error getting profile image URL:', error);
    return null;
  }
};

// Delete profile image
export const deleteProfileImage = async (fileId, userId) => {
  try {
    
    await storage.deleteFile(BUCKET_ID, fileId);
    
   
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
      profileImageId: null
    });
  } catch (error) {
    console.error('Profile deletion failed:', error);
    throw error;
  }
};

// Fetch user profile data
export const fetchUserProfile = async (userId) => {
  try {
    console.log("Fetching profile for user:", userId);
    const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
    console.log("Retrieved user document:", userDoc);
    
    const profileImageUrl = userDoc.profileImageId ? getProfileImageUrl(userDoc.profileImageId) : null;
    console.log("Generated profile image URL:", profileImageUrl);
    
    return {
      profileImageId: userDoc.profileImageId,
      profileImageUrl: profileImageUrl,
      ...userDoc
    };
  } catch (err) {
    console.log("No user profile found in database, trying file naming convention...", err);
    
   
    try {
      const files = await storage.listFiles(BUCKET_ID);
      console.log("Available files in bucket:", files.files.map(f => ({ id: f.$id, name: f.name })));
      
      const profileFile = files.files.find(file => 
        file.name.startsWith(`profile_${userId}`) ||
        file.$id === `profile_${userId}` ||
        file.name === `${userId}.jpg` ||
        file.name === `${userId}.png` ||
        file.name === `${userId}.jpeg` ||
        file.name === `${userId}.webp`
      );
      
      if (profileFile) {
        console.log("Found profile file:", profileFile);
        const profileImageUrl = getProfileImageUrl(profileFile.$id);
        return {
          profileImageId: profileFile.$id,
          profileImageUrl: profileImageUrl
        };
      }
    } catch (fileErr) {
      console.log("Error searching for profile files:", fileErr);
    }
    
    console.log("No profile image found for user:", userId);
    return { profileImageId: null, profileImageUrl: null };
  }
};
