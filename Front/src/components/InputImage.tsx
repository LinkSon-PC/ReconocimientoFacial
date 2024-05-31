import React, { useEffect, useRef, useState } from "react";

const InputImage: React.FC = () => {
  const [image, setImage] = useState<string | ArrayBuffer | null>(null);
  const [imageName, setImageName] = useState("");
  const [fileName, setFileName] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Obtén el resultado de reader.result y quita el prefijo data:image/...;base64,
        const base64String = reader.result.split(",")[1];
        setImage(base64String);
        setFileName(file.name);
        const nameWithoutExtension = file.name
          .split(".")
          .slice(0, -1)
          .join(".");
        setImageName(nameWithoutExtension);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (image && imageName) {
      const payload = {
        fileName: fileName,
        fullName: imageName,
        file: image,
      };

      fetch(import.meta.env.API_GATEWAY, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        .then(response => response.json())
        .then(data => {
          console.log('Success:', data);
            if(data.statusCode === 500){
                alert(data.body);
            }else if(data.statusCode === 200){
                const body = JSON.parse(data.body);
                alert(body.message);
            }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } else {
      alert("Please select an image.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white shadow-md rounded-md"
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Image:
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </label>
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Upload
      </button>
    </form>
  );
};

export default InputImage;
