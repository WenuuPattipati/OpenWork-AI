"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, FolderOpen, Check } from "lucide-react";
import { getCollections, saveCollection, addToCollection, type StoredCollection } from "@/lib/storage";

interface AddToCollectionModalProps {
  conversationId: string;
  conversationTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddToCollectionModal({
  conversationId,
  conversationTitle,
  onClose,
  onSuccess
}: AddToCollectionModalProps) {
  const [collections, setCollections] = useState<StoredCollection[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load collections and check which ones already contain this conversation
    const loadedCollections = getCollections();
    setCollections(loadedCollections);
    
    const alreadyIn = new Set(
      loadedCollections
        .filter(c => c.conversationIds.includes(conversationId))
        .map(c => c.id)
    );
    setSelectedCollections(alreadyIn);
  }, [conversationId]);

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    const newCollection: Omit<StoredCollection, 'expiresAt'> = {
      id: `collection_${Date.now()}`,
      name: newCollectionName.trim(),
      description: newCollectionDescription.trim(),
      conversationIds: [conversationId],
      createdAt: new Date()
    };

    saveCollection(newCollection);
    setCollections([...collections, { ...newCollection, expiresAt: Date.now() + 3600000 }]);
    setSelectedCollections(new Set([...selectedCollections, newCollection.id]));
    setNewCollectionName("");
    setNewCollectionDescription("");
    setShowCreateForm(false);
  };

  const toggleCollection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const handleSave = () => {
    setSaving(true);
    
    // Add to selected collections
    selectedCollections.forEach(collectionId => {
      addToCollection(collectionId, conversationId);
    });

    setTimeout(() => {
      setSaving(false);
      onSuccess?.();
      onClose();
    }, 300);
  };

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add to Collection</h2>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{conversationTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Collection Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <input
                type="text"
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCollectionName("");
                    setNewCollectionDescription("");
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* New Collection Button */}
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors mb-4"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create New Collection</span>
            </button>
          )}

          {/* Collections List */}
          {collections.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No collections yet. Create one to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Select collections:
              </p>
              {collections.map((collection) => {
                const isSelected = selectedCollections.has(collection.id);
                return (
                  <button
                    key={collection.id}
                    onClick={() => toggleCollection(collection.id)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {collection.name}
                          </h3>
                          {isSelected && (
                            <Check className="w-5 h-5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        {collection.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {collection.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {collection.conversationIds.length} conversation
                          {collection.conversationIds.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <FolderOpen className={`w-5 h-5 shrink-0 ml-2 ${
                        isSelected ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between shrink-0">
          <p className="text-sm text-gray-600">
            {selectedCollections.size} collection{selectedCollections.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedCollections.size === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
