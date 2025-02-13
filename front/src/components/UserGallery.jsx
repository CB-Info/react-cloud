import { useState, useContext } from "react";
import PropTypes from "prop-types";
import API from "../api/axios";
import { AuthContext } from "../contexts/AuthContext";

function UserGallery({ userImages, setUserImages }) {
  const [error, setError] = useState("");
  //const { logout } = useContext(AuthContext);

  const handleDelete = async (imageId) => {
    setError("");
    try {
      const token = localStorage.getItem("JWT");
      if (!token) {
        return;
      }

      const response = await API.delete(`/galleries/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setUserImages(userImages.filter((img) => img._id !== imageId));
      } else {
        setError("Impossible de supprimer l'image.");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression de l'image:", err);
      setError("Impossible de supprimer l'image.");
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-center text-gray-700">
        Mes images
      </h2>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {userImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {userImages.map((image) => (
            <div key={image._id} className="relative group">
              <img
                src={image.image}
                alt={image.title}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => handleDelete(image._id)}
                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">Aucune image trouvée.</p>
      )}
    </div>
  );
}
UserGallery.propTypes = {
  userImages: PropTypes.array.isRequired,
  setUserImages: PropTypes.func.isRequired,
};

export default UserGallery;
