import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { User, Mail, Building, Globe, Github, Twitter, Edit, Camera, Save, Loader2 } from 'lucide-react';
import { apiClient, ProfileResponse } from '../../lib/api';

interface ProfileState {
  name: string;
  role: string;
  company: string;
  email: string;
  website: string;
  github: string;
  twitter: string;
  bio: string;
  avatar_url: string;
}

const DEFAULT_PROFILE: ProfileState = {
  name: 'Sarah Chen',
  role: 'Core Maintainer',
  company: 'TechCorp Inc.',
  email: 'sarah.chen@example.com',
  website: 'https://sarahchen.dev',
  github: '@sarahchen',
  twitter: '@sarahchen_dev',
  bio: 'Open source enthusiast and community builder. Working on developer tools and AI-powered solutions.',
  avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
};

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [originalProfile, setOriginalProfile] = useState<ProfileState>(DEFAULT_PROFILE);

  const mapResponseToState = (data: ProfileResponse): ProfileState => {
    return {
      name: data.display_name || data.name || '',
      role: data.role || data.skills?.role || 'Core Maintainer',
      company: data.company || data.skills?.company || '',
      email: data.email || '',
      website: data.website || data.skills?.website || '',
      github: data.github || (data.skills?.github ? data.skills.github : ''),
      twitter: data.twitter || data.skills?.twitter || '',
      bio: data.bio || '',
      avatar_url: data.avatar_url || DEFAULT_PROFILE.avatar_url,
    };
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getProfile();
        if (isMounted && data) {
          const loadedProfile = mapResponseToState(data);
          setProfile(loadedProfile);
          setOriginalProfile(loadedProfile);
        }
      } catch (error: any) {
        console.error('Failed to fetch profile:', error);
        // In case API returns 401 or offline, fallback to defaults smoothly
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await apiClient.updateProfile({
        display_name: profile.name,
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        company: profile.company,
        website: profile.website,
        github: profile.github,
        twitter: profile.twitter,
        role: profile.role,
        avatar_url: profile.avatar_url,
      });

      const updatedState = mapResponseToState(updated);
      setProfile(updatedState);
      setOriginalProfile(updatedState);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const message = error?.response?.data?.detail || 'Failed to update profile. Please try again.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Loading profile...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isSaving}
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-lg transition-colors flex items-center"
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            <>
              <Save size={18} className="mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit size={18} className="mr-2" />
              Edit Profile
            </>
          )}
        </motion.button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-green-600 to-green-400 relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute bottom-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-lg text-white"
          >
            <Camera size={20} />
          </motion.button>
        </div>

        <div className="px-8 pb-8">
          <div className="flex items-end -mt-12 mb-8">
            <div className="relative">
              <img
                src={profile.avatar_url || DEFAULT_PROFILE.avatar_url}
                alt="Profile"
                className="w-24 h-24 rounded-xl border-4 border-gray-900 object-cover"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute bottom-2 right-2 p-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-white border border-gray-700"
              >
                <Camera size={14} />
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <div className="flex items-center space-x-3">
                  <User size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isEditing}
                    className="bg-transparent text-white focus:outline-none disabled:opacity-50 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <div className="flex items-center space-x-3">
                  <Mail size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                    className="bg-transparent text-white focus:outline-none disabled:opacity-50 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Company</label>
                <div className="flex items-center space-x-3">
                  <Building size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    disabled={!isEditing}
                    className="bg-transparent text-white focus:outline-none disabled:opacity-50 w-full"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Website</label>
                <div className="flex items-center space-x-3">
                  <Globe size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    disabled={!isEditing}
                    className="bg-transparent text-white focus:outline-none disabled:opacity-50 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">GitHub</label>
                <div className="flex items-center space-x-3">
                  <Github size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={profile.github}
                    onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                    disabled={!isEditing}
                    className="bg-transparent text-white focus:outline-none disabled:opacity-50 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Twitter</label>
                <div className="flex items-center space-x-3">
                  <Twitter size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={profile.twitter}
                    onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                    disabled={!isEditing}
                    className="bg-transparent text-white focus:outline-none disabled:opacity-50 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className="w-full bg-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
          </div>
          {isEditing && (
            <div className="mt-8 flex justify-end space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSaving}
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSaving}
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-lg transition-colors flex items-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;