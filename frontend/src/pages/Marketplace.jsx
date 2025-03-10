import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, X, MessageCircle, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../service/fireBaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  getDoc,
  setDoc,
} from "firebase/firestore";

const Marketplace = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    price: "",
    imageUrl: "",
  });
  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newOffer.title || !newOffer.description || !newOffer.price) {
      alert("Please fill in all required fields");
      return;
    }

    if (!currentUser) {
      alert("You must be logged in to create an offer");
      return;
    }

    try {
      let imageUrl = "";

      // If there's an image file, convert it to base64 for storage
      if (imageFile) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imageFile);
        });
      }

      // Create the offer object with image
      const offerData = {
        title: newOffer.title,
        description: newOffer.description,
        price: parseFloat(newOffer.price),
        postedBy: currentUser.email,
        postedByUid: currentUser.uid,
        postedByName: currentUser.email,
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
      };

      // Add to Firestore
      await addDoc(collection(db, "marketplace"), offerData);

      // Reset form and close modal
      setNewOffer({
        title: "",
        description: "",
        price: "",
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating offer:", error);
      alert("Failed to create offer");
    }
  };

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch offers
  useEffect(() => {
    const q = query(
      collection(db, "marketplace"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const offersList = [];
      snapshot.forEach((doc) => {
        offersList.push({ id: doc.id, ...doc.data() });
      });
      setOffers(offersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Delete offer function
  const handleDelete = async (id) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, "marketplace", id));
    } catch (error) {
      console.error("Error deleting offer:", error);
      alert("Failed to delete offer");
    }
  };

  // Updated Contact seller function
  const handleContactSeller = async (sellerId, sellerName, offerTitle) => {
    if (!currentUser) {
      alert("You must be logged in to message the seller");
      return;
    }

    try {
      // First, check if a chat already exists between these users
      const chatQuery1 = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser.uid)
      );

      const chatSnapshot = await getDocs(chatQuery1);
      let existingChatId = null;

      chatSnapshot.forEach((chatDoc) => {
        const chatData = chatDoc.data();
        if (chatData.participants.includes(sellerId)) {
          existingChatId = chatDoc.id;
        }
      });

      // If chat exists, navigate to it
      if (existingChatId) {
        navigate(`/chat`);
        return;
      }

      // If no chat exists, create a new one
      const chatData = {
        participants: [currentUser.uid, sellerId],
        participantInfo: {
          [currentUser.uid]: {
            displayName: currentUser.displayName || currentUser.email,
            email: currentUser.email,
          },
          [sellerId]: {
            displayName: sellerName,
            email: sellerName, // Using sellerName as email if actual email is not available
          },
        },
        lastMessage: {
          text: `Hello, I'm interested in your offer: "${offerTitle}"`,
          sentBy: currentUser.uid,
          timestamp: serverTimestamp(),
        },
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      // Add chat document
      const newChatRef = await addDoc(collection(db, "chats"), chatData);

      // Add the first message
      await addDoc(collection(db, "chats", newChatRef.id, "messages"), {
        text: `Hello, I'm interested in your offer: "${offerTitle}"`,
        sentBy: currentUser.uid,
        timestamp: serverTimestamp(),
      });

      // Navigate to the new chat
      navigate(`/chat/${newChatRef.id}`);
    } catch (error) {
      console.error("Error creating or finding chat:", error);
      alert("Failed to contact seller. Please try again later.");
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOffer(null);
  };

  // Render component
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        {currentUser && (
          <button
            className="bg-indigo-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-700"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusCircle size={20} />
            <span>Create Offer</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading offers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition bg-white cursor-pointer"
              onClick={() => {
                setSelectedOffer(offer);
                setIsDetailModalOpen(true);
              }}
            >
              {offer.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <h2 className="text-xl font-semibold mb-2">{offer.title}</h2>
                <p className="text-gray-600 mb-4">{offer.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">₹{offer.price}</span>
                  <span className="text-sm text-gray-500">
                    Posted by: {offer.postedByName}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create New Offer</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newOffer.title}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={newOffer.description}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Price (₹)</label>
                <input
                  type="number"
                  value={newOffer.price}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Image</label>
                {imagePreview && (
                  <div className="mb-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-40 rounded"
                    />
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    <Upload size={18} />
                    <span>Upload Image</span>
                  </button>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Create Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedOffer.title}</h2>
              <button
                onClick={handleCloseDetailModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {selectedOffer.imageUrl && (
              <div className="mb-4 overflow-hidden rounded flex justify-center">
                <img
                  src={selectedOffer.imageUrl}
                  alt={selectedOffer.title}
                  className="max-h-[400px] max-w-full object-contain"
                />
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold">Description:</h3>
              <p className="text-gray-700">{selectedOffer.description}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold">Price:</h3>
              <p className="text-xl font-bold">₹{selectedOffer.price}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold">Posted by:</h3>
              <p>{selectedOffer.postedByName}</p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleCloseDetailModal}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Close
              </button>

              {currentUser && selectedOffer.postedByUid !== currentUser.uid && (
                <button
                  className="bg-blue-500 text-white flex items-center gap-2 px-4 py-2 rounded hover:bg-blue-600"
                  onClick={() => {
                    handleContactSeller(
                      selectedOffer.postedByUid,
                      selectedOffer.postedByName,
                      selectedOffer.title
                    );
                    handleCloseDetailModal();
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Message Seller</span>
                </button>
              )}

              {currentUser && selectedOffer.postedByUid === currentUser.uid && (
                <button
                  className="bg-red-500 text-white flex items-center gap-2 px-4 py-2 rounded hover:bg-red-600"
                  onClick={() => {
                    handleDelete(selectedOffer.id);
                    handleCloseDetailModal();
                  }}
                >
                  <Trash2 size={18} />
                  <span>Delete Offer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
