"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquarePlus, 
  FolderOpen, 
  Star, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Search,
  X,
  Menu,
  Clock,
  Trash2
} from "lucide-react";
import { 
  getConversations, 
  getFavorites, 
  getCollections,
  saveCollection,
  deleteConversation,
  removeFavorite,
  type StoredConversation,
  type StoredFavorite,
  type StoredCollection
} from "@/lib/storage";

interface SidebarProps {
  mode: "doctor" | "general";
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export function Sidebar({ mode, onNewConversation, onSelectConversation, isOpen, onToggle }: SidebarProps) {
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [conversationsExpanded, setConversationsExpanded] = useState(true);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load data from localStorage
  const [favorites, setFavorites] = useState<StoredFavorite[]>([]);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [collections, setCollections] = useState<StoredCollection[]>([]);

  // Load data function
  const loadData = () => {
    const allConversations = getConversations();
    const allFavorites = getFavorites();
    const allCollections = getCollections();
    
    // Filter conversations by mode
    const modeConversations = allConversations.filter(c => c.mode === mode);
    
    setConversations(modeConversations);
    setFavorites(allFavorites);
    setCollections(allCollections);
  };

  // Load data on mount and set up refresh interval
  useEffect(() => {
    loadData();
    // Removed auto-refresh to prevent potential hanging on load
  }, [mode]);

  // Refresh data when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, mode]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter favorites based on search
  const filteredFavorites = favorites.filter(fav =>
    fav.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modeColor = mode === "doctor" ? "blue" : "purple";
  const modeGradient = mode === "doctor" 
    ? "from-blue-600 to-cyan-500" 
    : "from-purple-600 to-pink-500";

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  // Handle delete conversation
  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
    loadData();
  };

  // Handle remove favorite
  const handleRemoveFavorite = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    removeFavorite(conversationId);
    loadData();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-30 md:hidden"
        onClick={() => onToggle(false)}
      />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed left-0 top-0 h-screen w-[280px] bg-cream border-r border-gray-200 flex flex-col z-40"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => onToggle(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>Close sidebar</span>
          </button>
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewConversation();
              onToggle(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${modeGradient} hover:opacity-90 text-white rounded-xl transition-all font-medium cursor-pointer shadow-md`}
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Collections Button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowCollectionModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <FolderOpen className="w-5 h-5" />
            <span>Collections</span>
            <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
              {collections.length}
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
          {/* Favorites Section */}
          <div>
            <button
              onClick={() => setFavoritesExpanded(!favoritesExpanded)}
              className="w-full flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2 cursor-pointer"
            >
              {favoritesExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Favorites</span>
              <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                {filteredFavorites.length}
              </span>
            </button>

            <AnimatePresence>
              {favoritesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  {filteredFavorites.length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-2">
                      Mark responses as helpful to add favorites
                    </p>
                  ) : (
                    filteredFavorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="group relative"
                      >
                        <button
                          onClick={() => {
                            onSelectConversation(fav.conversationId);
                            onToggle(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all truncate cursor-pointer pr-8"
                        >
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-yellow-500 shrink-0" />
                            <span className="truncate">{fav.title}</span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleRemoveFavorite(e, fav.conversationId)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Conversations Section */}
          <div>
            <button
              onClick={() => setConversationsExpanded(!conversationsExpanded)}
              className="w-full flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2 cursor-pointer"
            >
              {conversationsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Recent</span>
              <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                {filteredConversations.length}
              </span>
            </button>

            <AnimatePresence>
              {conversationsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <MessageSquarePlus className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">
                        Start a conversation to see your history here
                      </p>
                    </div>
                  ) : (
                    filteredConversations.slice(0, 15).map((conv) => (
                      <div
                        key={conv.id}
                        className="group relative"
                      >
                        <button
                          onClick={() => {
                            onSelectConversation(conv.id);
                            onToggle(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all cursor-pointer pr-8"
                        >
                          <div className="truncate font-medium">{conv.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(conv.timestamp)}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${modeGradient} flex items-center justify-center text-white font-semibold text-sm`}>
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">User</p>
              <p className="text-xs text-gray-500 truncate capitalize">{mode} Mode</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Collection Modal */}
      <AnimatePresence>
        {showCollectionModal && (
          <CollectionModal
            collections={collections}
            onClose={() => setShowCollectionModal(false)}
            onRefresh={loadData}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Collection Modal Component
function CollectionModal({
  collections,
  onClose,
  onRefresh
}: {
  collections: StoredCollection[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreate = () => {
    if (name.trim()) {
      const newCollection: Omit<StoredCollection, 'expiresAt'> = {
        id: `collection_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        conversationIds: [],
        createdAt: new Date()
      };
      saveCollection(newCollection);
      setName("");
      setDescription("");
      setShowCreateForm(false);
      onRefresh();
    }
  };

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Collections</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Collection</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search collections"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[50vh]">
          {showCreateForm ? (
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Collection name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {filteredCollections.length === 0 && !showCreateForm ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No collections yet
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                Collections help you organize your conversations.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Create Collection
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {collection.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {collection.conversationIds.length} conversation{collection.conversationIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <FolderOpen className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
